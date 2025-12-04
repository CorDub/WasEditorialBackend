import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import { addKindleSale } from "../../routes/adminRoutes.js";
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



describe("adding valid kindle sale", async() => {
  let mockReq, mockRes, addedKindleSales;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11");
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11");

    mockReq = {
      "body": {
        "book": newBook.id,
        "quantityEbook": 10,
        "quantityPod": 10,
        "dateCut": "2025-09-04T00:00:00.000Z",
        "datePay": "2025-11-04T00:00:00.000Z",
        "regalias": 121.5
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  // afterAll(async() => {
  //   for (const kindleSale of addedKindleSales) {await deleteFromDB(prisma, kindleSale, "kindleSale")}
  //   await deleteFromDB(prisma, newPayment2, "payment")
  //   await deleteFromDB(prisma, newPayment, "payment")
  //   await deleteFromDB(prisma, newBook, "book")
  //   await deleteFromDB(prisma, newAuthor, "author")
  //   await deleteFromDB(prisma, newAuthor2, "author")
  // })

  it("should return status 200", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should create the kindle sale in the database`, async() => {
    addedKindleSales = await prisma.kindleSale.findMany({where: {bookId: newBook.id}})
    expect(addedKindleSales.length).toBe(1)
    expect(addedKindleSales[0].bookId).toBe(newBook.id)
    expect(addedKindleSales[0].quantityEbook).toBe(10)
    expect(addedKindleSales[0].quantityPod).toBe(10)
    expect(addedKindleSales[0].dateCut).toStrictEqual(new Date("2025-09-04T00:00:00.000Z"))
    expect(addedKindleSales[0].datePay).toStrictEqual(new Date("2025-11-04T00:00:00.000Z"))
    expect(addedKindleSales[0].regalias).toBe(121.5)
  })
});


describe("adding kindle sale with missing parameters", async() => {
  let mockReq, mockRes, addedKindleSales, mute;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")

    mockReq = {
      "body": {
        "quantityEbook": 10,
        "quantityPod": 10,
        "dateCut": "2025-08-13T00:00:00.000Z",
        "datePay": "2025-10-13T00:00:00.000Z",
        "regalias": 121.5
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    // for (const kindleSale of addedKindleSales) {await deleteFromDB(prisma, kindleSale, "kindleSale")}
    // await deleteFromDB(prisma, newPayment2, "payment")
    // await deleteFromDB(prisma, newPayment, "payment")
    // await deleteFromDB(prisma, newBook, "book")
    // await deleteFromDB(prisma, newAuthor, "author")
    // await deleteFromDB(prisma, newAuthor2, "author")
    mute.mockRestore()
  })

  it("should return status 500", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it(`should not create a new kindleSale in the database`, async() => {
    addedKindleSales = await prisma.kindleSale.findMany({where: {bookId: newBook.id}})
    expect(addedKindleSales.length).toBe(0)
  })
})
