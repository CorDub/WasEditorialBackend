import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getInventoriesByBook,
} from "../../../routes/admin/inventories/getInventoriesByBook.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createTestDB,
  dropTestDB,
  createTransfer,
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

afterAll(async() =>  {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe("getInventoriesByBook returns the correct results", async() => {
  let mockReq, mockRes, jsonResponse;
  let category;
  let author;
  let book, book2;
  let bookstore, bookstore2;
  let inventory1, inventory2, inventory3;
  let payment;

  let transfer, deletedTransfer, transfer2;
  let transfer3, transfer4, transfer5, deletedTransfer2;

  let impression1, impression2, deletedImpression, entregadosDelAutor;
  let sale1, sale2, deletedSale;

  let impression3, impression4, impression5, deletedImpression2, entregadosDelAutor2;
  let sale3, sale4, deletedSale2;

  let entregadosDelAutor3;
  let sale5, sale6, deletedSale3;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book2.id, bookstore.id)
    inventory3 = await createInventory(prisma, book2.id, bookstore2.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    transfer = await createTransfer(prisma, inventory1.id, {quantity: 10})
    deletedTransfer = await createTransfer(prisma, inventory1.id, {quantity: 10, isDeleted: true})
    transfer2 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10})

    transfer3 = await createTransfer(prisma, inventory2.id, {quantity: 7})
    transfer4 = await createTransfer(prisma, inventory2.id, {quantity: 7})
    transfer5 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10})
    deletedTransfer2 = await createTransfer(prisma, inventory2.id, {quantity: 7, isDeleted: true})

    impression1 = await createImpression(prisma, book.id, {quantity: 200, date: new Date("2025-01-01")})
    impression2 = await createImpression(prisma, book.id, {quantity: 100})
    deletedImpression = await createImpression(prisma, book.id, {quantity: 100, isDeleted: true})
    // entregadosDelAutor = await createImpression(prisma, book.id, {quantity: 5, authorDelivery: true})
    sale1 = await createSale(prisma, inventory1.id, [payment.id], {quantity: 3})
    sale2 = await createSale(prisma, inventory1.id, [payment.id], {quantity: 4})
    deletedSale = await createSale(prisma, inventory1.id, [payment.id], {quantity: 3, isDeleted: true})

    impression3 = await createImpression(prisma, book2.id, {quantity: 200, date: new Date("2025-01-01")})
    impression4 = await createImpression(prisma, book2.id, {quantity: 100})
    impression5 = await createImpression(prisma, book2.id, {quantity: 50})
    deletedImpression2 = await createImpression(prisma, book2.id, {quantity: 100, isDeleted: true})
    // entregadosDelAutor2 = await createImpression(prisma, book2.id, {quantity: 5, authorDelivery: true})
    sale3 = await createSale(prisma, inventory2.id, [payment.id], {quantity: 3})
    sale4 = await createSale(prisma, inventory2.id, [payment.id], {quantity: 4})
    deletedSale2 = await createSale(prisma, inventory1.id, [payment.id], {quantity: 3, isDeleted: true})

    // entregadosDelAutor3 = await createImpression(prisma, book2.id, {quantity: 5, authorDelivery: true})
    sale5 = await createSale(prisma, inventory3.id, [payment.id], {quantity: 3})
    sale6 = await createSale(prisma, inventory3.id, [payment.id], {quantity: 4})
    deletedSale3 = await createSale(prisma, inventory3.id, [payment.id], {quantity: 3, isDeleted: true})

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should return an array of length 2`, async() => {
    await getInventoriesByBook(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
    jsonResponse = mockRes.json.mock.calls[0][0];

    expect(Array.isArray(jsonResponse)).toBeTruthy()
    expect(jsonResponse.length).toBe(2)
  })

  it(`should return the correct values for book1`, async() => {
    const book1Res = jsonResponse.find(el => el.id === book.id)
    expect(book1Res.id).toBe(book.id)
    expect(book1Res.name).toBe(book.title)
    expect(book1Res.type).toBe("book")
    expect(book1Res.impressionInicial).toBe(200)
    expect(book1Res.extraImpressions).toBe(100)
    expect(book1Res.ventas).toBe(7)
    // expect(book1Res.entregadosDelAutor).toBe(5)
    expect(book1Res.entregadosAlAutor).toBe(10)
    expect(book1Res.disponibles).toBe(283)
  })

  it(`should return the correct aggregate values for book2`, async() => {
    const book2Res = jsonResponse.find(el => el.id === book2.id)
    expect(book2Res.id).toBe(book2.id)
    expect(book2Res.name).toBe(book2.title)
    expect(book2Res.type).toBe("book")
    expect(book2Res.impressionInicial).toBe(200)
    expect(book2Res.extraImpressions).toBe(150)
    expect(book2Res.ventas).toBe(14)
    // expect(book2Res.entregadosDelAutor).toBe(10)
    expect(book2Res.entregadosAlAutor).toBe(14)
    expect(book2Res.disponibles).toBe(322)
  })
})