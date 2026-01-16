import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getMonthlySalesByPayments } from "../../routes/authorRoutes.js";
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
import * as mailer from "../../mailer.js"

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



describe(`getting all valid monthly sales by payments`, () => {
  let mockReq, mockRes, jsonRes;
  let category1, category2;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;
  let cost1, cost2, cost3;

  beforeAll(async() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));

    category1 = await createCategory(prisma, {number: 3, category_type: "comissions"})
    category2 = await createCategory(prisma, {number: 4, category_type: "regalias"})
    author = await createAuthor(prisma)
    book1 = await createBook(prisma, [author.id], {categoryId: category1.id})
    book2 = await createBook(prisma, [author.id], {categoryId: category2.id})
    bookstore1 = await createBookstore(prisma, {deal_percentage: 50})
    bookstore2 = await createBookstore(prisma, {deal_percentage: 30})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amount: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amount: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amount: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      prisma: prisma,
      ltm: new Date("2025-11-04")
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it(`should return status 200`, async() => {
    await getMonthlySalesByPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return sales grouped by month within last 12 months`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes.length).toBe(13)
  })

  it(`should return the total for each month, taking into account sales, kindleSales and costs, 
  and excluding deleted and out of range sales`, async() => {
    expect(jsonRes[1].sales.length).toBe(2)
    expect(jsonRes[1].costs.length).toBe(1)
    expect(jsonRes[1].totalQuantity).toBe(30)
    expect(jsonRes[1].totalValue).toBe(2653)

    expect(jsonRes[2].sales.length).toBe(2)
    expect(jsonRes[2].costs.length).toBe(1)
    expect(jsonRes[2].totalQuantity).toBe(20)
    expect(Number(jsonRes[2].totalValue.toFixed(2))).toBe(1895)
  })

  it(`should pad months with no sales with empty data`, async() => {
    expect(jsonRes[0].sales).toStrictEqual([])
    expect(jsonRes[0].costs).toStrictEqual([])
    expect(jsonRes[3].sales).toStrictEqual([])
    expect(jsonRes[3].costs).toStrictEqual([])
    expect(jsonRes[4].sales).toStrictEqual([])
    expect(jsonRes[4].costs).toStrictEqual([])
    expect(jsonRes[5].sales).toStrictEqual([])
    expect(jsonRes[5].costs).toStrictEqual([])
    expect(jsonRes[6].sales).toStrictEqual([])
    expect(jsonRes[6].costs).toStrictEqual([])
    expect(jsonRes[7].sales).toStrictEqual([])
    expect(jsonRes[7].costs).toStrictEqual([])
    expect(jsonRes[8].sales).toStrictEqual([])
    expect(jsonRes[8].costs).toStrictEqual([])
    expect(jsonRes[9].sales).toStrictEqual([])
    expect(jsonRes[9].costs).toStrictEqual([])
    expect(jsonRes[10].sales).toStrictEqual([])
    expect(jsonRes[10].costs).toStrictEqual([])
    expect(jsonRes[11].sales).toStrictEqual([])
    expect(jsonRes[11].costs).toStrictEqual([])
    expect(jsonRes[12].sales).toStrictEqual([])
    expect(jsonRes[12].costs).toStrictEqual([])    
  })

  it(`should sort the months in descending order (newer first)`, async() => {
    expect(jsonRes[0].forMonth).toBe("2025-11")
    expect(jsonRes[12].forMonth).toBe("2024-11")
  })
})