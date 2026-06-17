import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getOtherBookstoreInventories,
  getWasInventories,
  getBookstoreInventory
} from "../../../routes/admin/inventories/getBookstoreInventory.js";
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


describe(`getOtherBookstoreInventories returns the correct values`, async() => {
  let results;
  let category;
  let author;
  let book, book2, deletedBook;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let transferTo;
  let transferTo2;
  let transferTo3;
  let deletedTransferTo;
  let transferFrom;
  let sale1;
  let sale2;
  let deletedSale;
  let entregadoAlAutor, entregadoAlAutor2, deletedEntregadoAlAutor;
  let entregadoDelAutor, entregadoDelAutor2, deletedEntregadoDelAutor;

  let otherInventory2;
  let transferTo4;
  let transferTo5;
  let transferTo6;
  let deletedTransferTo2;
  let transferFrom2;
  let sale3;
  let sale4;
  let deletedSale2;
  let entregadoAlAutor3, entregadoAlAutor4, deletedEntregadoAlAutor2;
  let entregadoDelAutor3, entregadoDelAutor4, deletedEntregadoDelAutor2;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    deletedBook = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    transferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 100})
    transferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 50})
    transferTo3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 20})
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5, isDeleted: true})
    transferFrom = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 20})
    sale1 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 2})
    sale2 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 1})
    deletedSale = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 4, isDeleted: true})
    entregadoAlAutor = await createTransfer(prisma, otherInventory.id, {quantity:10})
    entregadoAlAutor2 = await createTransfer(prisma, otherInventory.id, {quantity:5})
    deletedEntregadoAlAutor = await createTransfer(prisma, otherInventory.id, {quantity:5, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherInventory.id, quantity: 5})
    entregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: otherInventory.id, quantity: 2})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherInventory.id, quantity: 5, isDeleted: true})

    otherInventory2 = await createInventory(prisma, book2.id, otherBookstore.id);
    transferTo4 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory2.id, quantity: 50})
    transferTo5 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory2.id, quantity: 25})
    transferTo6 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory2.id, quantity: 10})
    deletedTransferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory2.id, quantity: 5, isDeleted: true})
    transferFrom2 = await createTransfer(prisma, otherInventory2.id, {toInventoryId: wasInventory.id, quantity: 15})
    sale3 = await createSale(prisma, otherInventory2.id, [payment.id], {quantity: 4})
    sale4 = await createSale(prisma, otherInventory2.id, [payment.id], {quantity: 2})
    deletedSale2 = await createSale(prisma, otherInventory2.id, [payment.id], {quantity: 8, isDeleted: true})
    entregadoAlAutor3 = await createTransfer(prisma, otherInventory2.id, {quantity:10})
    entregadoAlAutor4 = await createTransfer(prisma, otherInventory2.id, {quantity:5})
    deletedEntregadoAlAutor2 = await createTransfer(prisma, otherInventory2.id, {quantity:5, isDeleted: true})
    entregadoDelAutor3 = await createTransfer(prisma, null, {toInventoryId: otherInventory2.id, quantity: 5})
    entregadoDelAutor4 = await createTransfer(prisma, null, {toInventoryId: otherInventory2.id, quantity: 2})
    deletedEntregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: otherInventory2.id, quantity: 5, isDeleted: true})
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

  it(`should return an object with total and specifics as keys`, async() => {
    results = await getOtherBookstoreInventories(prisma, otherBookstore.id)
    expect(Object.keys(results)).toHaveLength(2)
    expect(results).toHaveProperty('total')
    expect(results).toHaveProperty('specifics')
  })

  it(`should return the correct values for book inventory 1`, async() => {
    const bookInventory1 = results.specifics.find(el => el.bookId === book.id)
    expect(bookInventory1.name).toBe(book.title)
    expect(bookInventory1.copias).toBe(170)
    expect(bookInventory1.inicial).toBe(100)
    expect(bookInventory1.extraTransfers).toBe(70)
    expect(bookInventory1.returns).toBe(20)
    expect(bookInventory1.entregadosAlAutor).toBe(15)
    expect(bookInventory1.entregadosDelAutor).toBe(7)
    expect(bookInventory1.ventas).toBe(3)
    expect(bookInventory1.disponibles).toBe(139)
    expect(bookInventory1.bookId).toBe(book.id)
  })

  it(`should return the correct values for book inventory 2`, async() => {
    const bookInventory2 = results.specifics.find(el => el.bookId === book2.id)
    expect(bookInventory2.name).toBe(book2.title)
    expect(bookInventory2.copias).toBe(85)
    expect(bookInventory2.inicial).toBe(50)
    expect(bookInventory2.extraTransfers).toBe(35)
    expect(bookInventory2.returns).toBe(15)
    expect(bookInventory2.entregadosAlAutor).toBe(15)
    expect(bookInventory2.entregadosDelAutor).toBe(7)
    expect(bookInventory2.ventas).toBe(6)
    expect(bookInventory2.disponibles).toBe(56)
    expect(bookInventory2.bookId).toBe(book2.id)
  })

  it(`should return the correct values for the total`, async() => {
    const total = results.total
    expect(total.name).toBe(otherBookstore.name)
    expect(total.copias).toBe(255)
    expect(total.inicial).toBe(150)
    expect(total.extraTransfers).toBe(105)
    expect(total.returns).toBe(35)
    expect(total.entregadosAlAutor).toBe(30)
    expect(total.entregadosDelAutor).toBe(14)
    expect(total.ventas).toBe(9)
    expect(total.disponibles).toBe(195)
    expect(total.bookstoreId).toBe(otherBookstore.id)
  })

  it(`the values of total should be internally consistent`, async() => {
    const total = results.total
    const expectedCopias = total.inicial + total.extraTransfers
    const expectedDisponibles = 
      total.copias - 
      total.returns - 
      total.ventas - 
      total.entregadosAlAutor +
      total.entregadosDelAutor
    expect(expectedCopias).toBe(255)
    expect(expectedDisponibles).toBe(195)
  })
})


describe(`getWasInventories returns the correct values`, async() => {
  let results;
  let category;
  let author;
  let book, book2, deletedBook;
  let wasBookstore, otherBookstore;
  let wasInventory, otherWasInventory, thirdInventory, fourthInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, transferTo3, deletedTransferTo; 
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;

  let impression4, impression5, impression6, deletedImpression2;
  let entregadoDelAutor2, deletedEntregadoDelAutor2;
  let transferTo4, transferTo5, transferTo6, deletedTransferTo2; 
  let entregadoAlAutor2, deletedEntregadoAlAutor2;
  let transferFrom2;
  let sale3, sale4, deletedSale2;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    deletedBook = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherWasInventory = await createInventory(prisma, book2.id, wasBookstore.id)
    thirdInventory = await createInventory(prisma, book.id, otherBookstore.id)
    fourthInventory = await createInventory(prisma, book2.id, otherBookstore.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    impression = await createImpression(prisma, book.id, {quantity: 500, date: new Date("2025-01-01")})
    impression2 = await createImpression(prisma, book.id, {quantity: 100})
    impression3 = await createImpression(prisma, book.id, {quantity: 50})
    deletedImpression = await createImpression(prisma, book.id, {quantity: 500, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})
    transferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 100})
    transferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50})
    transferTo3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 20})
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 2})
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 2, isDeleted: true})
    transferFrom = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 20})
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 2})
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 1})
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 4, isDeleted: true})

    impression4 = await createImpression(prisma, book2.id, {quantity: 250, date: new Date("2025-01-01")})
    impression5 = await createImpression(prisma, book2.id, {quantity: 50})
    impression6 = await createImpression(prisma, book2.id, {quantity: 25})
    deletedImpression2 = await createImpression(prisma, book2.id, {quantity: 500, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherWasInventory.id, quantity: 2})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherWasInventory.id, quantity: 10, isDeleted: true})
    transferTo4 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 100})
    transferTo5 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 50})
    transferTo6 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 20})
    deletedTransferTo2 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor2 = await createTransfer(prisma, otherWasInventory.id, {quantity: 5})
    deletedEntregadoAlAutor2 = await createTransfer(prisma, otherWasInventory.id, {quantity: 2, isDeleted: true})
    transferFrom2 = await createTransfer(prisma, fourthInventory.id, {toInventoryId: otherWasInventory.id, quantity: 30})
    sale3 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 5})
    sale4 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 9})
    deletedSale2 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 4, isDeleted: true})
  })

  // STATE
  // WAS INVENTORY
  // Impressions inicial: 500
  // extra impressions: 150
  // Transfers out : 170
  // Given to author: 2
  // Entregados del autor: 1
  // Return : +20
  // Sales: 3
  // Copias: 481
  // Disponibles: 496

  // THIRD INVENTORY
  // Inicial: 100
  // Extra transfers: 70
  // Return: -20

  // OTHER WAS INVENTORY
  // Impression inicial: 250
  // extra impressions: 75
  // Tranbsfers out: 170
  // Given to author: 5
  // Return: +30
  // Sales: 14
  // Copias: 157
  // Disponibles: 168

  // FOURTH INVENTORY
  // Inicial: 100
  // Extra transfers: 70
  // Return: -30

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

  it(`should return an object with total and specifics as keys`, async() => {
    results = await getWasInventories(prisma, wasBookstore.id)
    expect(Object.keys(results)).toHaveLength(2)
    expect(results).toHaveProperty('total')
    expect(results).toHaveProperty('specifics')
  })

  it(`should return the correct values for the first book inventory`, async() => {
    const firstWas = results.specifics.find(el => el.bookId === book.id)
    expect(firstWas.name).toBe(book.title)
    expect(firstWas.copias).toBe(481)
    expect(firstWas.inicial).toBe(500)
    expect(firstWas.extraImpressions).toBe(150)
    expect(firstWas.returns).toBe(20)
    expect(firstWas.transfers).toBe(170)
    expect(firstWas.entregadosDelAutor).toBe(1)
    expect(firstWas.entregadosAlAutor).toBe(2)
    expect(firstWas.ventas).toBe(3)
    expect(firstWas.disponibles).toBe(496)
    expect(firstWas.bookId).toBe(book.id)
  })

  it(`should return the correct values for the second book inventory`, async() => {
    const secondWas = results.specifics.find(el => el.bookId === book2.id)
    expect(secondWas.name).toBe(book2.title)
    expect(secondWas.copias).toBe(157)
    expect(secondWas.inicial).toBe(250)
    expect(secondWas.extraImpressions).toBe(75)
    expect(secondWas.returns).toBe(30)
    expect(secondWas.transfers).toBe(170)
    expect(secondWas.entregadosDelAutor).toBe(2)
    expect(secondWas.entregadosAlAutor).toBe(5)
    expect(secondWas.ventas).toBe(14)
    expect(secondWas.disponibles).toBe(168)
    expect(secondWas.bookId).toBe(book2.id)
  })

  it(`should return correct values for the total`, async() => {
    const total = results.total
    expect(total.name).toBe(wasBookstore.name)
    expect(total.copias).toBe(638)
    expect(total.inicial).toBe(750)
    expect(total.extraImpressions).toBe(225)
    expect(total.returns).toBe(50)
    expect(total.transfers).toBe(340)
    expect(total.entregadosDelAutor).toBe(3)
    expect(total.entregadosAlAutor).toBe(7)
    expect(total.ventas).toBe(17)
    expect(total.disponibles).toBe(664)
    expect(total.bookstoreId).toBe(wasBookstore.id)
  })

  it(`values for the total should be internally consistent`, async() => {
    const total = results.total
    const expectedCopias = 
      total.inicial
      + total.extraImpressions
      + total.entregadosDelAutor
      - total.transfers
    const expectedDisponibles = 
      total.copias
      - total.ventas
      + total.returns
      - total.entregadosAlAutor
    expect(expectedCopias).toBe(638)
    expect(expectedDisponibles).toBe(664)
  })
})


describe(`getBookstoreInventories returns the correct values when querying for was`, async() => {
  let mockReq, mockRes, results;
  let category;
  let author;
  let book, book2, deletedBook;
  let wasBookstore, otherBookstore;
  let wasInventory, otherWasInventory, thirdInventory, fourthInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, transferTo3, deletedTransferTo; 
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;

  let impression4, impression5, impression6, deletedImpression2;
  let entregadoDelAutor2, deletedEntregadoDelAutor2;
  let transferTo4, transferTo5, transferTo6, deletedTransferTo2; 
  let entregadoAlAutor2, deletedEntregadoAlAutor2;
  let transferFrom2;
  let sale3, sale4, deletedSale2;

  let sale5;
  let sale6;
  let deletedSale3;

  let sale7;
  let sale8;
  let deletedSale4;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    deletedBook = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherWasInventory = await createInventory(prisma, book2.id, wasBookstore.id)
    thirdInventory = await createInventory(prisma, book.id, otherBookstore.id)
    fourthInventory = await createInventory(prisma, book2.id, otherBookstore.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    impression = await createImpression(prisma, book.id, {quantity: 500, date: new Date("2025-01-01")})
    impression2 = await createImpression(prisma, book.id, {quantity: 100})
    impression3 = await createImpression(prisma, book.id, {quantity: 50})
    deletedImpression = await createImpression(prisma, book.id, {quantity: 500, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1, isDeleted: true})
    transferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 100})
    transferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50})
    transferTo3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 20})
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 2})
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 2, isDeleted: true})
    transferFrom = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 20})
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 2})
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 1})
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 4, isDeleted: true})

    impression4 = await createImpression(prisma, book2.id, {quantity: 250, date: new Date("2025-01-01")})
    impression5 = await createImpression(prisma, book2.id, {quantity: 50})
    impression6 = await createImpression(prisma, book2.id, {quantity: 25})
    deletedImpression2 = await createImpression(prisma, book2.id, {quantity: 500, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherWasInventory.id, quantity: 2})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: otherWasInventory.id, quantity: 10, isDeleted: true})
    transferTo4 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 100})
    transferTo5 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 50})
    transferTo6 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 20})
    deletedTransferTo2 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor2 = await createTransfer(prisma, otherWasInventory.id, {quantity: 5})
    deletedEntregadoAlAutor2 = await createTransfer(prisma, otherWasInventory.id, {quantity: 2, isDeleted: true})
    transferFrom2 = await createTransfer(prisma, fourthInventory.id, {toInventoryId: otherWasInventory.id, quantity: 30})
    sale3 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 5})
    sale4 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 9})
    deletedSale2 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 4, isDeleted: true})

    sale5 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 2})
    sale6 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 1})
    deletedSale3 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 4, isDeleted: true})

    sale7 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 4})
    sale8 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 2})
    deletedSale4 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 8, isDeleted: true})

    mockReq = {
      params: {
        id: wasBookstore.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  // STATE
  // WAS INVENTORY
  // Impressions inicial: 500
  // extra impressions: 150
  // Transfers out : 170
  // Given to author: 2
  // Entregados del autor: 1
  // Return : +20
  // Sales: 3
  // Copias: 481
  // Disponibles: 496

  // THIRD INVENTORY
  // Inicial: 100
  // Extra transfers: 70
  // Return: -20

  // OTHER WAS INVENTORY
  // Impression inicial: 250
  // extra impressions: 75
  // Tranbsfers out: 170
  // Given to author: 5
  // Return: +30
  // Sales: 14
  // Copias: 157
  // Disponibles: 168

  // FOURTH INVENTORY
  // Inicial: 100
  // Extra transfers: 70
  // Return: -30

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

  it(`should return an object with keys total and specifics`, async() => {
    await getBookstoreInventory(mockReq, mockRes);
    results = mockRes.json.mock.calls[0][0]
    expect(Object.keys(results)).toHaveLength(2)
    expect(results).toHaveProperty('total')
    expect(results).toHaveProperty('specifics')
  })

  it(`should return the correct values for specific inventories and totals`, async() => {
    const firstWas = results.specifics.find(el => el.bookId === book.id)
    expect(firstWas.name).toBe(book.title)
    expect(firstWas.copias).toBe(481)
    expect(firstWas.inicial).toBe(500)
    expect(firstWas.extraImpressions).toBe(150)
    expect(firstWas.returns).toBe(20)
    expect(firstWas.transfers).toBe(170)
    expect(firstWas.entregadosDelAutor).toBe(1)
    expect(firstWas.entregadosAlAutor).toBe(2)
    expect(firstWas.ventas).toBe(3)
    expect(firstWas.disponibles).toBe(496)
    expect(firstWas.bookId).toBe(book.id)

    const secondWas = results.specifics.find(el => el.bookId === book2.id)
    expect(secondWas.name).toBe(book2.title)
    expect(secondWas.copias).toBe(157)
    expect(secondWas.inicial).toBe(250)
    expect(secondWas.extraImpressions).toBe(75)
    expect(secondWas.returns).toBe(30)
    expect(secondWas.transfers).toBe(170)
    expect(secondWas.entregadosDelAutor).toBe(2)
    expect(secondWas.entregadosAlAutor).toBe(5)
    expect(secondWas.ventas).toBe(14)
    expect(secondWas.disponibles).toBe(168)
    expect(secondWas.bookId).toBe(book2.id)

    const total = results.total
    expect(total.name).toBe(wasBookstore.name)
    expect(total.copias).toBe(638)
    expect(total.inicial).toBe(750)
    expect(total.extraImpressions).toBe(225)
    expect(total.returns).toBe(50)
    expect(total.transfers).toBe(340)
    expect(total.entregadosDelAutor).toBe(3)
    expect(total.entregadosAlAutor).toBe(7)
    expect(total.ventas).toBe(17)
    expect(total.disponibles).toBe(664)
    expect(total.bookstoreId).toBe(wasBookstore.id)
  })
})


describe(`getBookstoreInventories returns the correct values when querying for other bookstores`, async() => {
  let mockReq, mockRes, results;
  let category;
  let author;
  let book, book2, deletedBook;
  let wasBookstore, otherBookstore;
  let wasInventory, otherWasInventory, thirdInventory, fourthInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, entregadoDelAutor2, deletedEntregadoDelAutor;
  let transferTo, transferTo2, transferTo3, deletedTransferTo; 
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;

  let impression4, impression5, impression6, deletedImpression2;
  let entregadoDelAutor3, entregadoDelAutor4, deletedEntregadoDelAutor2;
  let transferTo4, transferTo5, transferTo6, deletedTransferTo2; 
  let entregadoAlAutor2, deletedEntregadoAlAutor2;
  let transferFrom2;
  let sale3, sale4, deletedSale2;

  let sale5;
  let sale6;
  let deletedSale3;

  let sale7;
  let sale8;
  let deletedSale4;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    deletedBook = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherWasInventory = await createInventory(prisma, book2.id, wasBookstore.id)
    thirdInventory = await createInventory(prisma, book.id, otherBookstore.id)
    fourthInventory = await createInventory(prisma, book2.id, otherBookstore.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    impression = await createImpression(prisma, book.id, {quantity: 500, date: new Date("2025-01-01")})
    impression2 = await createImpression(prisma, book.id, {quantity: 100})
    impression3 = await createImpression(prisma, book.id, {quantity: 50})
    deletedImpression = await createImpression(prisma, book.id, {quantity: 500, isDeleted: true})
    transferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 100})
    transferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50})
    transferTo3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 20})
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor = await createTransfer(prisma, thirdInventory.id, {quantity: 2})
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 2, isDeleted: true})
    transferFrom = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 20})
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 2})
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 1})
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 4, isDeleted: true})
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: thirdInventory.id, quantity: 1})
    entregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: thirdInventory.id, quantity: 1})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: thirdInventory.id, quantity: 1, isDeleted: true})

    impression4 = await createImpression(prisma, book2.id, {quantity: 250, date: new Date("2025-01-01")})
    impression5 = await createImpression(prisma, book2.id, {quantity: 50})
    impression6 = await createImpression(prisma, book2.id, {quantity: 25})
    deletedImpression2 = await createImpression(prisma, book2.id, {quantity: 500, isDeleted: true})
    transferTo4 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 100})
    transferTo5 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 50})
    transferTo6 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 20})
    deletedTransferTo2 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: fourthInventory.id, quantity: 5, isDeleted: true})
    entregadoAlAutor2 = await createTransfer(prisma, fourthInventory.id, {quantity: 5})
    deletedEntregadoAlAutor2 = await createTransfer(prisma, fourthInventory.id, {quantity: 2, isDeleted: true})
    transferFrom2 = await createTransfer(prisma, fourthInventory.id, {toInventoryId: otherWasInventory.id, quantity: 30})
    sale3 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 5})
    sale4 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 9})
    deletedSale2 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 4, isDeleted: true})
    entregadoDelAutor3 = await createTransfer(prisma, null, {toInventoryId: fourthInventory.id, quantity: 2})
    entregadoDelAutor4 = await createTransfer(prisma, null, {toInventoryId: fourthInventory.id, quantity: 2})
    deletedEntregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: fourthInventory.id, quantity: 2, isDeleted: true})

    sale5 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 2})
    sale6 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 1})
    deletedSale3 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 4, isDeleted: true})

    sale7 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 4})
    sale8 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 2})
    deletedSale4 = await createSale(prisma, fourthInventory.id, [payment.id], {quantity: 8, isDeleted: true})

    mockReq = {
      params: {
        id: otherBookstore.id
      },
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

  it(`should return an object with keys total and specifics`, async() => {
    await getBookstoreInventory(mockReq, mockRes);
    results = mockRes.json.mock.calls[0][0]
    expect(Object.keys(results)).toHaveLength(2)
    expect(results).toHaveProperty('total')
    expect(results).toHaveProperty('specifics')
  })

  it(`should return the correct values for specific inventories and totals`, async() => {
    const bookInventory1 = results.specifics.find(el => el.bookId === book.id)
    expect(bookInventory1.name).toBe(book.title)
    expect(bookInventory1.copias).toBe(170)
    expect(bookInventory1.inicial).toBe(100)
    expect(bookInventory1.extraTransfers).toBe(70)
    expect(bookInventory1.returns).toBe(20)
    expect(bookInventory1.entregadosAlAutor).toBe(2)
    expect(bookInventory1.entregadosDelAutor).toBe(2)
    expect(bookInventory1.ventas).toBe(3)
    expect(bookInventory1.disponibles).toBe(147)
    expect(bookInventory1.bookId).toBe(book.id)

    const bookInventory2 = results.specifics.find(el => el.bookId === book2.id)
    expect(bookInventory2.name).toBe(book2.title)
    expect(bookInventory2.copias).toBe(170)
    expect(bookInventory2.inicial).toBe(100)
    expect(bookInventory2.extraTransfers).toBe(70)
    expect(bookInventory2.returns).toBe(30)
    expect(bookInventory2.entregadosAlAutor).toBe(5)
    expect(bookInventory2.entregadosDelAutor).toBe(4)
    expect(bookInventory2.ventas).toBe(6)
    expect(bookInventory2.disponibles).toBe(133)
    expect(bookInventory2.bookId).toBe(book2.id)

    const total = results.total
    expect(total.name).toBe(otherBookstore.name)
    expect(total.copias).toBe(340)
    expect(total.inicial).toBe(200)
    expect(total.extraTransfers).toBe(140)
    expect(total.returns).toBe(50)
    expect(total.entregadosAlAutor).toBe(7)
    expect(total.entregadosDelAutor).toBe(6)
    expect(total.ventas).toBe(9)
    expect(total.disponibles).toBe(280)
    expect(total.bookstoreId).toBe(otherBookstore.id)
  })
})