import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getAuthorPayments } from "../../../routes/author/commissions/getAuthorPayments.js";
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
  truncateAll,
} from "../../../testUtils.js";
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



describe(`getting all valid ltm payments for the author`, async() => {
  let mockReq, mockRes, jsonRes;
  let category1, category2;
  let author;
  let book1, book2, book3;
  let bookstore1, bookstore2;
  let inventory1, inventory2, inventory3, inventory4;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale, outOfRangeSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;
  let cost1, cost2, cost3;

  beforeAll(async() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-04"))

    category1 = await createCategory(prisma, {number: 2, category_type: "comissions"})
    category2 = await createCategory(prisma, {number: 3, category_type: "regalias"})
    author = await createAuthor(prisma)
    book1 = await createBook(prisma, [author.id], {categoryId: category1.id})
    book2 = await createBook(prisma, [author.id], {categoryId: category2.id})
    book3 = await createBook(prisma, [author.id], {categoryId: category1.id})
    bookstore1 = await createBookstore(prisma, {deal_percentage: 50})
    bookstore2 = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 80})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    inventory3 = await createInventory(prisma, book3.id, bookstore1.id, {initial: 100, current: 90, price: 300})
    inventory4 = await createInventory(prisma, book1.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10", {status: "created"})
    payment2 = await createPayment(prisma, author.id, "2025-09", {status: "solicited"})
    payment3 = await createPayment(prisma, author.id, "2023-10", {status: "solicited"})
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, dateStr: "2025-10-02"})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, dateStr: "2025-10-02"})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, dateStr: "2025-10-02"})
    sale3 = await createSale(prisma, inventory3.id, [payment2.id], {quantity: 10, dateStr: "2025-09-02"})
    sale4 = await createSale(prisma, inventory4.id, [payment2.id], {quantity: 10, dateStr: "2025-09-02"})
    outOfRangeSale = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, dateStr: "2023-10-02"})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-10-02", regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-09-02", regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2023-10-02", regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-10-02", regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amount: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amount: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amount: 100, isDeleted: true})

    // Sale 1 : comission was over the min (price 379) - 189.5 per book - 1895 total
    // Sale 2 : comission regalias (price 379) - 75.8 per book - 758 total
    // Sale 3 : comission was under the min (price 300) - 120 per book - 1200 total
    // Sale 4 : comission other bookstore (price 379, 30 deal perc, 5 extra) - 246.35 per book - 2463.5 total
    // Sale 5 : deleted sale - doesn't matter
    // Sale 6 : out of range sale - doesn't matter

    mockReq = {
      session: {
        user_id: author.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    vi.useRealTimers()
    await truncateAll(prisma)
  })

  it(`should return status 200`, async() => {
    await getAuthorPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return a package with all payments from the last 12 months`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes.length).toBe(13)
  })

  it(`should return an object with forMonth, status and amount for each month`, async() => {
    try {
      for (const month of jsonRes) {
        expect(Object.keys(month)).toEqual(['forMonth','status','amount'])
      }
    } catch (error) {
      console.log(`Error `, error)
      throw error
    }
  })

  it(`should return months in descending order (newest first)`, async() => {
    expect(jsonRes[0].forMonth).toBe("2025-11")
    expect(jsonRes[12].forMonth).toBe("2024-11")
  })

  it(`should correctly calculate the amount for each month, 
  excluding deleted and out of range sales, kindleSales and costs`, async() => {
    expect(jsonRes[0].amount).toBe(0)
    expect(jsonRes[1].amount).toBe(2653)
    expect(jsonRes[2].amount).toBe(3663.5)
    expect(jsonRes[3].amount).toBe(0)
    expect(jsonRes[4].amount).toBe(0)
    expect(jsonRes[5].amount).toBe(0)
    expect(jsonRes[6].amount).toBe(0)
    expect(jsonRes[7].amount).toBe(0)
    expect(jsonRes[8].amount).toBe(0)
    expect(jsonRes[9].amount).toBe(0)
    expect(jsonRes[10].amount).toBe(0)
    expect(jsonRes[11].amount).toBe(0)
    expect(jsonRes[12].amount).toBe(0)
  })

  it(`should correctly return the status for each month`, async() => {
    expect(jsonRes[0].status).toBe("created")
    expect(jsonRes[1].status).toBe("created")
    expect(jsonRes[2].status).toBe("solicited")
    expect(jsonRes[3].status).toBe("created")
    expect(jsonRes[4].status).toBe("created")
    expect(jsonRes[5].status).toBe("created")
    expect(jsonRes[6].status).toBe("created")
    expect(jsonRes[7].status).toBe("created")
    expect(jsonRes[8].status).toBe("created")
    expect(jsonRes[9].status).toBe("created")
    expect(jsonRes[10].status).toBe("created")
    expect(jsonRes[11].status).toBe("created")
    expect(jsonRes[12].status).toBe("created")
  })
})



describe(`getting payments but not loggedd in`, async() => {
  let mockReq, mockRes, jsonRes, mute;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;
  let cost1, cost2, cost3;

  beforeAll(async() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-04"))

    category1 = await createCategory(prisma, {number: 4, management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, dateStr: "2025-10-02"})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, dateStr: "2025-10-02"})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, dateStr: "2025-10-02"})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, dateStr: "2025-09-02"})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, dateStr: "2023-10-02"})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-10-02", regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-09-02", regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2023-10-02", regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePayStr: "2025-10-02", regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: undefined
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
    vi.useRealTimers()
    mute.mockRestore()
    await truncateAll(prisma)
  })

  it(`should return status 401`, async() => {
    await getAuthorPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not return any data`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({message: "Unauthorized"})
  })
})