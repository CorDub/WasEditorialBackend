import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getAuthorSales } from "../../routes/authorRoutes.js";
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


describe(`get author sales with valid parameters`, () => {
  let mockReq, mockRes, jsonRes;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;

  beforeAll(async() => {
    category1 = await createCategory(prisma, {management_min: 100})
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
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      query: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-11-04")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await getAuthorSales(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the total quantity and value of sales 
  as well as sales by book and all individual sales`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(Object.keys(jsonRes)).toEqual(['totalSales', 'totalValue', 'bookSales', 'sales'])
  })

  it(`should correctly sum up the quantity of all sales excluding deleted or out of range`, async() => {
    expect(jsonRes.totalSales).toBe(50)
  })

  it(`should correctly sum up sales value excluding deleted or out of range`, async() => {
    expect(jsonRes.totalValue).toBe(11199.76)
  })

  it(`should correctly group sales by book in bookSales`, async() => {
    expect(jsonRes.bookSales.length).toBe(2)

    let book1totalQuantity = 0;
    let book1Value = 0;
    let book2totalQuantity = 0;
    let book2Value = 0;

    for (const book of jsonRes.bookSales) {
      if (book.title === book1.title) {
        book1totalQuantity += book.quantity
        book1Value += book.value
      } else {
        book2totalQuantity += book.quantity
        book2Value += book.value
      }
    }

    expect(book1totalQuantity).toBe(30)
    expect(book2totalQuantity).toBe(20)
    expect(book1Value).toBe(7099.86)
    expect(book2Value).toBe(4099.9)
  })

  it(`should correctly contain all individual sales info in Sales`, async() => {
    expect(jsonRes.sales.length).toBe(5)
  })
})



describe(`get author sale without being logged in`, async() => {
  let mockReq, mockRes, jsonRes, mute;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;

  beforeAll(async() => {
    category1 = await createCategory(prisma, {management_min: 100})
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
    sale1 = await createSale(prisma, inventory1.id, [ payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [ payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [ payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [ payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [ payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: null
      },
      query: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-11-04")
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

  it(`should return a status 401`, async() => {
    await getAuthorSales(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not return any data`, async() => {
    const jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({message: "Unauthorized"})
  })
})



describe(`get author sale with invalid parameters`, async() => {
  let mockReq, mockRes, jsonRes, mute;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;

  beforeAll(async() => {
    category1 = await createCategory(prisma, {management_min: 100})
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
    sale1 = await createSale(prisma, inventory1.id, [ payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [ payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [ payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [ payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [ payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      query: {
        startDate: new Date("2025-10-02"),
        endDate: new Date("2025-09-02")
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

  it(`should return a status 400`, async() => {
    await getAuthorSales(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`should not return any data`, async() => {
    const jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({message: "The start date cannot come after the end date"})
  })
})