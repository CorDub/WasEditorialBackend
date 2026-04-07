import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getUserExtra
} from "../../routes/user/getUserExtra.js";
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



describe(`get user extra info`, async() => {
  let mockReq, mockRes, newUser, jsonResponse;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
      }
    );

    mockReq = {
      session: {
        user_id: newUser.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it(`should return a 200  status`, async() => {
    await getUserExtra(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the extra info for the logged in user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.email).toBe(newUser.email)
    expect(jsonResponse.phone).toBe("5544809945")
    expect(jsonResponse.birthday).toBe("22121988")
    expect(jsonResponse.font_size).toBe(1.1)
    expect(jsonResponse.clabe).toBe(null)
    expect(jsonResponse.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(jsonResponse.bank).toBe("Inbursa")
    expect(jsonResponse.swift).toBe(null)
  })
})



describe(`get extra user info for deleted user`, async() => {
  let mockReq, mockRes, newUser, jsonResponse, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        isDeleted: true
      }
    );

    mockReq = {
      session: {
        user_id: newUser.id
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

  it(`should return a 204 status`, async() => {
    await getUserExtra(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(204)
  })

  it(`should not send the extra info for the logged in user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toEqual({message: "No user found"})
  })
})