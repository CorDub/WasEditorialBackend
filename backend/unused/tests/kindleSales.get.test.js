import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import { getKindleSales } from "../../routes/adminRoutes.js";
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



describe("getting all valid kindle sales", async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, newKindleSale2, newKindleSale3, deletedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-01-02"), regalias: 100})
    newKindleSale3 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-01-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100, isDeleted: true})

    mockReq = {
      query: {
        startDate: new Date("2024-11-01"),
        endDate: new Date("2025-11-10")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await getKindleSales(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid kindleSales compiled per months in the selected range`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.length).toBe(13)
  })

  it(`should compile sales per months`, async() => {
    let saleIds = [];
    for (const sale of jsonResponse[7].sales) {
      saleIds.push(sale.id)
    }
    expect(saleIds.includes(newKindleSale.id)).toBe(true)
    expect(saleIds.includes(deletedKindleSale.id)).toBe(false)

    let saleIds2 =[];
    for (const sale of jsonResponse[2].sales) {
      saleIds2.push(sale.id)
    }
    expect(saleIds2.includes(newKindleSale2.id)).toBe(true)
    expect(saleIds2.includes(newKindleSale3.id)).toBe(true)
  })
})


describe("getting all valid kindle sales with restricted date range", async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, newKindleSale2, newKindleSale3, deletedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-01-02"), regalias: 100})
    newKindleSale3 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-01-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100, isDeleted: true})

    mockReq = {
      query: {
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-11-10")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await getKindleSales(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid kindleSales compiled per months in the selected range`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    // console.log("jsonResponse", jsonResponse)
    expect(jsonResponse.length).toBe(10)
  })

  it(`should compile sales per months`, async() => {
    let saleIds = [];
    for (const sale of jsonResponse[4].sales) {
      saleIds.push(sale.id)
    }
    expect(saleIds.includes(newKindleSale.id)).toBe(true)
    expect(saleIds.includes(deletedKindleSale.id)).toBe(false)

    let saleIdsEntirely = [];
    for (const month of jsonResponse) {
      for (const sale of month.sales) {
        saleIdsEntirely.push(sale.id)
      }
    }
    expect(saleIdsEntirely.includes(newKindleSale2.id)).toBe(false)
    expect(saleIdsEntirely.includes(newKindleSale3.id)).toBe(false)
  })
})
