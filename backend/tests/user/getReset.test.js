import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getReset
} from "../../routes/user/getReset.js";
import { changePassword } from "../../routes/user/changePassword.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB,
  truncateAll
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import * as mailer from "../../mailer.js";
import bcrypt from "bcrypt";

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})

describe(`getting password reset email with valid parameters`, async() => {
  let mockReq, mockRes, mailSpy, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma)

    mockReq = {
      body: {
        email: newUser.email
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailSpy = vi.spyOn(mailer, "sendTokenResetPasswordMail").mockResolvedValue();
  })

  afterAll(async() => {
    mailSpy.mockRestore()
    await truncateAll(prisma)
  })

  it(`should return a 200 status`, async() => {
    await getReset(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the reset password email with a random string token`, async() => {
    expect(mailSpy).toHaveBeenCalledExactlyOnceWith(newUser.email, newUser.first_name, expect.stringMatching(/^[0-9a-f]{64}$/))
  })

  // it(`should pass you the userId`, async() => {
  //   jsonResponse = mockRes.json.mock.calls[0][0]
  //   expect(jsonResponse.id).toBe(newUser.id)
  // })
})



describe(`no user with the email provided`, () => {
  let mockReq, mockRes, mailSpy, jsonResponse;

  beforeAll(async() => {
    mockReq = {
      body: {
        email: "corentindubois56@gmail.com"
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailSpy = vi.spyOn(mailer, "sendTokenResetPasswordMail").mockResolvedValue();

    await getReset(mockReq, mockRes)
  })

  afterAll(async() => {
    mailSpy.mockRestore()
    await truncateAll(prisma)
  })

  it(`should return a 400`, async() => {
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })
})



describe(`deleted user with the email provided`, () => {
  let mockReq, mockRes, mailSpy, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, {isDeleted: true})

    mockReq = {
      body: {
        email: newUser.email
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailSpy = vi.spyOn(mailer, "sendTokenResetPasswordMail").mockResolvedValue();

    await getReset(mockReq, mockRes)
  })

  afterAll(async() => {
    mailSpy.mockRestore()
    await truncateAll(prisma)
  })

  it(`should return a 400`, async() => {
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })
})