import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteCost } from "../../routes/adminRoutes.js";
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
let category1;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



// DELETING
describe(`deleting a cost with valid parameters`, async() => {
  let mockReq, mockRes; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma)
    newAuthor2 = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 50.25, note: "newCost"})

    mockReq = {
      params: {
        id: newCost.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await deleteCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should mark the cost as deleted in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.isDeleted).toBe(true)
  })
})