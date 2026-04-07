import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  logout
} from "../../routes/user/logout.js";
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

describe(`logout correctly`, async() => {
  let mockReq, mockRes, newUser;

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
      session: {
        user_id: newUser.id,
        destroy: vi.fn((cb) => cb(null))
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a status 200`, async() => {
    await logout(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should log out the user`, async() => {
    expect(mockReq.session.destroy).toHaveBeenCalled()
  })

  it(`should clear the session cookie`, async() => {
    expect(mockRes.clearCookie).toHaveBeenCalledExactlyOnceWith("connect.sid")
  })
})