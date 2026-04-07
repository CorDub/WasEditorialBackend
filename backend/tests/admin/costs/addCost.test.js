import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addCost } from "../../../routes/admin/costs/addCost.js";
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
} from "../../../testUtils.js";
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



describe("adding a valid cost without paymentId", () => {
  let newAuthor, newAuthor2, newBook, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCost, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma)
    newAuthor2 = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])

    mockReq = {
      body: {
        "amount": "50.25",
        "note": "Costos adicionales de impresion",
        "dateStr": "2025-11-04",
        "bookId": newBook.id
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore();
  })

  it("should return status 201 and return json with message", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "message": "Cost created successfully",
    })
  })

  // it(`should correctly create a cost for each payment tied to the authors list`, async() => {
  //   addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
  //   expect(addedCosts.length).toBe(2)
  // })

  it(`should correctly create a new payment for the main author only if they're not provided,`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(1)
  })

  it(`should create the costs with the right data`, async() => {
    addedCost = await prisma.cost.findFirst({where: {bookId: newBook.id}})
    expect(addedCost.amount).toBe(50.25)
    expect(addedCost.note).toBe("Costos adicionales de impresion")
    expect(addedCost.dateStr).toBe("2025-11-04")
    expect(addedCost.bookId).toBe(newBook.id)
  })
})



describe(`adding a valid cost with paymentId`, async() => {
  let newAuthor, newAuthor2, newBook, newPayment, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCosts

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma)
    newAuthor2 = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})

    mockReq = {
      body: {
        "paymentId": newPayment.id,
        "amount": "50.25",
        "dateStr": "2025-11-04",
        "note": "Costos adicionales de impresion",
        "bookId": newBook.id
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should return status 201 and return json with message", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "message": "Cost created successfully",
    })
  })

  it(`should only create a cost for the paymentId provided`, async() => {
    addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
    expect(addedCosts.length).toBe(1)
  })

  it(`should not create new payments if a paymentId is provided`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(1)
  })

  it(`should create the cost with the right data`, async() => {
    for (const cost of addedCosts) {
      try {
        expect(cost.amount).toBe(50.25)
        expect(cost.note).toBe("Costos adicionales de impresion")
        expect(cost.dateStr).toBe("2025-11-04")
        expect(cost.bookId).toBe(newBook.id)
      } catch(error) {
        console.log(`error at cost with id ${cost.id}`)
        throw new Error("oh no")
      }
    }
  })
})



describe(`adding an invalid cost`, async() => {
  let newAuthor, newAuthor2, newBook, newPayment, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCosts, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma)
    newAuthor2 = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})

    mockReq = {
      body: {
        "paymentId": newPayment.id,
        "amount": "cinquenta punto veinti cinco",
        "note": "Costos adicionales de impresion",
        "bookId": newBook.id
      }, 
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it("should return status 500", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it(`should not create a cost for the paymentId provided`, async() => {
    addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
    expect(addedCosts.length).toBe(0)
  })

  it(`should not create new payments`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(1)
  })
})