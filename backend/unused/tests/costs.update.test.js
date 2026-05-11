import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateCost } from "../../routes/adminRoutes.js";
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



describe(`updating a cost with valid parameters`, async() => {
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
      body: {
        amount: 100.25,
        note: "newCosy",
        date: "2025-11-04",
        bookId: newBook.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should properly update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(100.25)
    expect(updatedCost.note).toBe("newCosy")
    expect(updatedCost.date.toISOString().slice(0, 10)).toBe("2025-11-04")
  })
})


describe(`updating a cost with invalid parameters`, async() => {
  let mockReq, mockRes, mute; 
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
      body: {
        amount: "cien venticinco",
        note: "newCosy",
        date: "2025-11-04",
        bookId: newBook.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(50.25)
    expect(updatedCost.note).toBe("newCost")
    expect(updatedCost.date.toISOString().slice(0, 10)).not.toBe("2025-11-04")
  })
})



describe(`updating a deleted cost`, async() => {
  let mockReq, mockRes, mute; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma)
    newAuthor2 = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 50.25, note: "newCost", isDeleted: true})

    mockReq = {
      params: {
        id: newCost.id
      },
      body: {
        amount: 100.25,
        note: "newCosy",
        date: "2025-11-04",
        bookId: newBook.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(50.25)
    expect(updatedCost.note).toBe("newCost")
    expect(updatedCost.date.toISOString().slice(0, 10)).not.toBe("2025-11-04")
  })
})