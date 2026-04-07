import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getConfirmationCode
} from "../../routes/user/getConfirmationCode.js";
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
  deleteFromDB
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

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


describe(`validating a wrong validation code`, async() => {
  let mockReq, mockRes, newUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586
      }
    );

    mockReq = {
      body: {
        confirmation_code: "X12K45",
        user_id: newUser.id
      },
      session: {
        user_id: null
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(null)
  })
})


describe(`validate the confirmation code for a deleted user`, async() => {
  let mockReq, mockRes, newUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        confirmation_code: 124586,
        user_id: newUser.id
      },
      session: {
        user_id: null
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(null)
  })
})