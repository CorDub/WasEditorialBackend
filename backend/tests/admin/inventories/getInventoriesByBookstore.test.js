import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getTotalWasImpressions,
  getTotalWasTransfers,
  handleWasInventories,
  transfersOthers,
  handleOtherInventories,
  getInventoriesByBookstore,
} from "../../../routes/admin/inventories/getInventoriesByBookstore.js";
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

describe("handleWasInventories works correctly", async() => {
  let category;
  let author;
  let book, book2;
  let wasBookstore, otherBookstore, thirdBookstore;
  let wasInventory, otherInventory, thirdInventory;
  let transfer1, transfer2, transfer3, deletedTransfer;
  let return1, return2, return3, deletedReturn;
  let entregaAlAutor1, entregaAlAutor2, entregaAlAutor3, deletedEntregaAlAutor;
  let impression1, impression2, impression3, deletedImpression;
  let entregadoDelAutor1, entregadoDelAutor2, entregadoDelAutor3, deletedEntregadoDelAutor;
  let payment;
  let wasSale1, wasSale2, wasSale3, deletedWasSale;
  let otherSale1, otherSale2, otherSale3, deletedOtherSale;

  let otherWasInventory;
  let transfer4, transfer5, transfer6, deletedTransfer2;
  let return4, return5, return6, deletedReturn2;
  let entregaAlAutor4, entregaAlAutor5, entregaAlAutor6, deletedEntregaAlAutor2;
  let impression4, impression5, impression6, deletedImpression2;
  let entregadoDelAutor4, entregadoDelAutor5, entregadoDelAutor6, deletedEntregadoDelAutor2;
  let wasSale4, wasSale5, wasSale6, deletedWasSale2;
  let otherSale4, otherSale5, otherSale6, deletedOtherSale2;


  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    thirdBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    thirdInventory = await createInventory(prisma, book.id, thirdBookstore.id);
    transfer1 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10})
    transfer2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5})
    transfer3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 2})
    deletedTransfer = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, isDeleted: true})
    return1 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 10})
    return2 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 7})
    return3 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 3})
    deletedReturn = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})
    entregaAlAutor1 = await createTransfer(prisma, wasInventory.id, {quantity: 10})
    entregaAlAutor2 = await createTransfer(prisma, wasInventory.id, {quantity: 9})
    entregaAlAutor3 = await createTransfer(prisma, wasInventory.id, {quantity: 8})
    deletedEntregaAlAutor = await createTransfer(prisma, wasInventory.id, {quantity: 10, isDeleted: true})
    impression1 = await createImpression(prisma, book.id, {quantity: 100, date: new Date("2025-01-01")});
    impression2 = await createImpression(prisma, book.id, {quantity: 50, date: new Date()});
    impression3 = await createImpression(prisma, book.id, {quantity: 25, date: new Date()});
    deletedImpression = await createImpression(prisma, book.id, {quantity: 100, date: new Date("2024-01-01"), isDeleted: true});
    // entregadoDelAutor1 = await createImpression(prisma, book.id, {quantity: 2, date: new Date(), authorDelivery: true});
    // entregadoDelAutor2 = await createImpression(prisma, book.id, {quantity: 4, date: new Date(), authorDelivery: true});
    // entregadoDelAutor3 = await createImpression(prisma, book.id, {quantity: 6, date: new Date(), authorDelivery: true});
    // deletedEntregadoDelAutor = await createImpression(prisma, book.id, {quantity: 2, date: new Date(), isDeleted: true, authorDelivery: true});
    entregadoDelAutor1 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 2})
    entregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 4})
    entregadoDelAutor3 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 6})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 2, isDeleted: true})
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));
    wasSale1 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 5})
    wasSale2 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 7})
    wasSale3 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 9})
    deletedWasSale = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 9, isDeleted: true})
    otherSale1 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 4})
    otherSale2 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 6})
    otherSale3 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 8})
    deletedOtherSale = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 9, isDeleted: true})

    otherWasInventory = await createInventory(prisma, book2.id, wasBookstore.id);
    transfer4 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherInventory.id, quantity: 10})
    transfer5 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherInventory.id, quantity: 5})
    transfer6 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherInventory.id, quantity: 2})
    deletedTransfer2 = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, isDeleted: true})
    return4 = await createTransfer(prisma, otherInventory.id, {toInventoryId: otherWasInventory.id, quantity: 10})
    return5 = await createTransfer(prisma, otherInventory.id, {toInventoryId: otherWasInventory.id, quantity: 7})
    return6 = await createTransfer(prisma, otherInventory.id, {toInventoryId: otherWasInventory.id, quantity: 3})
    deletedReturn2 = await createTransfer(prisma, otherInventory.id, {toInventoryId: otherWasInventory.id, quantity: 10, isDeleted: true})
    entregaAlAutor4 = await createTransfer(prisma, otherWasInventory.id, {quantity: 10})
    entregaAlAutor5 = await createTransfer(prisma, otherWasInventory.id, {quantity: 9})
    entregaAlAutor6 = await createTransfer(prisma, otherWasInventory.id, {quantity: 8})
    deletedEntregaAlAutor2 = await createTransfer(prisma, otherWasInventory.id, {quantity: 10, isDeleted: true})
    impression4 = await createImpression(prisma, book2.id, {quantity: 100, date: new Date("2025-01-01")});
    impression5 = await createImpression(prisma, book2.id, {quantity: 50, date: new Date()});
    impression6 = await createImpression(prisma, book2.id, {quantity: 25, date: new Date()});
    deletedImpression2 = await createImpression(prisma, book2.id, {quantity: 100, date: new Date("2024-01-01"), isDeleted: true});
    // entregadoDelAutor4 = await createImpression(prisma, book2.id, {quantity: 2, date: new Date(), authorDelivery: true});
    // entregadoDelAutor5 = await createImpression(prisma, book2.id, {quantity: 4, date: new Date(), authorDelivery: true});
    // entregadoDelAutor6 = await createImpression(prisma, book2.id, {quantity: 6, date: new Date(), authorDelivery: true});
    // deletedEntregadoDelAutor2 = await createImpression(prisma, book2.id, {quantity: 2, date: new Date(), isDeleted: true, authorDelivery: true});
    entregadoDelAutor4 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 2})
    entregadoDelAutor5 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 4})
    entregadoDelAutor6 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 6})
    deletedEntregadoDelAutor2 = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 2, isDeleted: true})
    wasSale4 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 5})
    wasSale5 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 7})
    wasSale6 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 9})
    deletedWasSale2 = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 9, isDeleted: true})
    otherSale4 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 4})
    otherSale5 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 6})
    otherSale6 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 8})
    deletedOtherSale2 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 9, isDeleted: true})
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

  it(`should return the right numbers for the WAS inventories`, async() => {
    const inventory = await prisma.inventory.findMany({
      where: {
        bookstoreId: wasBookstore.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        },
        sales: true,
        transfersFrom: true,
        transfersTo: true
      }
    })

    const res = handleWasInventories(inventory)
    expect(res.name).toBe("WAS Editorial")
    expect(res.copias).toBe(340)
    expect(res.impressionInicial).toBe(200)
    expect(res.extraImpressions).toBe(150)
    expect(res.returns).toBe(40)
    expect(res.transfers).toBe(34)
    expect(res.entregadosDelAutor).toBe(24)
    expect(res.entregadosAlAutor).toBe(54)
    expect(res.ventas).toBe(42)
    expect(res.disponibles).toBe(284)
  })
})


describe(`transfersOthers works correctly`, async() => {
  let category;
  let author;
  let book, book2;
  let wasBookstore, otherBookstore, thirdBookstore;
  let wasInventory, otherInventory, thirdInventory;
  let transfer1, transfer2, transfer3, deletedTransfer;
  let return1, return2, return3, deletedReturn;
  let transfer4, transfer5, transfer6, deletedTransfer2;
  let return4, return5, return6, deletedReturn2;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    transfer1 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, deliveryDate: new Date("2025-01-01")})
    transfer2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5})
    transfer3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 2})
    deletedTransfer = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, isDeleted: true, deliveryDate: new Date("2024-01-01")})
    return1 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 2})
    return2 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 1})
    return3 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 3})
    deletedReturn = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})

    thirdBookstore = await createBookstore(prisma);
    thirdInventory = await createInventory(prisma, book.id, thirdBookstore.id);
    transfer4 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 10, deliveryDate: new Date("2025-01-01")})
    transfer5 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 5})
    transfer6 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 2})
    deletedTransfer2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 10, isDeleted: true, deliveryDate: new Date("2024-01-01")})
    return4 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 2})
    return5 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 1})
    return6 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 3})
    deletedReturn2 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})
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

  it(`should return the correct numbers for the transfers`, async() => {
    const inventories = await prisma.inventory.findMany({
      where: {
        bookstoreId: {not: wasBookstore.id}
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    const res = transfersOthers(inventories)
    expect(res.transferInicial).toBe(20)
    expect(res.extraTransfers).toBe(14)
    expect(res.returns).toBe(12)
  })
})


describe(`handleOtherInventories works correctly`, async() => {
  let category;
  let author;
  let book, book2;
  let wasBookstore, otherBookstore, thirdBookstore;
  let wasInventory, otherInventory, thirdInventory;
  let transfer1, transfer2, transfer3, deletedTransfer;
  let return1, return2, return3, deletedReturn;
  let transfer4, transfer5, transfer6, deletedTransfer2;
  let return4, return5, return6, deletedReturn2;

  let payment;
  let otherSale1, otherSale2, otherSale3, deletedOtherSale;
  let thirdSale1, thirdSale2, thirdSale3, deletedThirdSale;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    transfer1 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, deliveryDate: new Date("2025-01-01")})
    transfer2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5})
    transfer3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 2})
    deletedTransfer = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10, isDeleted: true, deliveryDate: new Date("2024-01-01")})
    return1 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 2})
    return2 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 1})
    return3 = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 3})
    deletedReturn = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})

    thirdBookstore = await createBookstore(prisma);
    thirdInventory = await createInventory(prisma, book.id, thirdBookstore.id);
    transfer4 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 100, deliveryDate: new Date("2025-01-01")})
    transfer5 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50})
    transfer6 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 20})
    deletedTransfer2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: thirdInventory.id, quantity: 10, isDeleted: true, deliveryDate: new Date("2024-01-01")})
    return4 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 20})
    return5 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 10})
    return6 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 30})
    deletedReturn2 = await createTransfer(prisma, thirdInventory.id, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})

    payment = await createPayment(prisma, author.id, getForMonth(new Date()));
    otherSale1 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 1})
    otherSale2 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 2})
    otherSale3 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 1})
    deletedOtherSale = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 9, isDeleted: true})

    thirdSale1 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 10})
    thirdSale2 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 20})
    thirdSale3 = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 10})
    deletedThirdSale = await createSale(prisma, thirdInventory.id, [payment.id], {quantity: 9, isDeleted: true})
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

  it(`should give the correct numbers`, async() => {
    const otherInventories = await prisma.inventory.findMany({
      where: {
        bookstoreId: {not: wasBookstore.id}
      },
      include: {
        sales: true,
        transfersTo: true,
        transfersFrom: true,
        bookstore: true
      }
    })
    const res = handleOtherInventories(otherInventories)
    expect(Array.isArray(res)).toBeTruthy()
    expect(res.length).toBe(2)

    expect(res[0].name).toBe(otherBookstore.name)
    expect(res[0].copias).toBe(17)
    expect(res[0].transferInicial).toBe(10)
    expect(res[0].extraTransfers).toBe(7)
    expect(res[0].returns).toBe(6)
    expect(res[0].ventas).toBe(4)
    expect(res[0].disponibles).toBe(7)

    expect(res[1].name).toBe(thirdBookstore.name)
    expect(res[1].copias).toBe(170)
    expect(res[1].transferInicial).toBe(100)
    expect(res[1].extraTransfers).toBe(70)
    expect(res[1].returns).toBe(60)
    expect(res[1].ventas).toBe(40)
    expect(res[1].disponibles).toBe(70)
  })
})


describe(`getInventoriesByBookstores works correctly`, async() => {
  let mockReq, mockRes, jsonResponse;

  let category;
  let author;
  let book, book2;
  let payment;
  let wasBookstore, otherBookstore, otherWasBookstore, thirdBookstore;
  let wasInventory, otherInventory, otherWasInventory, thirdInventory, otherThirdBookstoreInventory;

  let impressionInicialWasInventory;
  let extraImpressionWasInventory;
  let extraImpressionWasInventory2;
  let deletedImpressionWasInventory;

  let impressionInicialOtherWasInventory;
  let extraImpressionOtherWasInventory;
  let extraImpressionOtherWasInventory2;
  let deletedImpressionOtherWasInventory;

  let transferInicialToOtherBookstore;
  let extraTransferToOtherBookstore;
  let deletedTransferToOtherBookstore;

  let transferInicialToThirdBookstore;
  let extraTransferToThirdBookstore; 
  let deletedTransferToThirdBookstore;

  let transferInicialToOtherThirdBookstoreInventory;
  let extraTransferToOtherThirdBookstoreInventory; 
  let deletedTransferToOtherThirdBookstoreInventory;

  let entregadosDelAutorWas;
  let entregadosDelAutorOtherWas;

  let entregadosAlAutorWas;
  let entregadosAlAutorOtherWas;

  let saleWas;
  let saleOtherWas;

  let saleOtherBookstore;
  let saleThirdBookstore;

  let saleOtherBookstore2;
  let saleThirdBookstore2;

  let deletedSaleOtherThirdBookstore;
  let saleOtherThirdBookstore;

  let returnOtherBookstore;
  let returnThirdBookstore;
  let returnOtherThirdBookstore;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()))

    wasBookstore = await createBookstore(prisma);
    otherWasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    thirdBookstore = await createBookstore(prisma);

    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherWasInventory = await createInventory(prisma, book2.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    thirdInventory = await createInventory(prisma, book2.id, thirdBookstore.id);
    otherThirdBookstoreInventory = await createInventory(prisma, book.id, thirdBookstore.id);

    impressionInicialWasInventory = await createImpression(prisma, book.id, {quantity: 200})
    extraImpressionWasInventory = await createImpression(prisma, book.id, {quantity: 100})
    extraImpressionWasInventory2 = await createImpression(prisma, book.id, {quantity: 50})
    deletedImpressionWasInventory = await createImpression(prisma, book.id, {quantity: 50, isDeleted: true})

    impressionInicialOtherWasInventory = await createImpression(prisma, book2.id, {quantity: 200})
    extraImpressionOtherWasInventory = await createImpression(prisma, book2.id, {quantity: 100})
    extraImpressionOtherWasInventory2 = await createImpression(prisma, book2.id, {quantity: 50})
    deletedImpressionOtherWasInventory = await createImpression(prisma, book2.id, {quantity: 50, isDeleted: true})

    transferInicialToOtherBookstore = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 100, deliveryDate: new Date("2025-01-01")})
    extraTransferToOtherBookstore = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 50})
    deletedTransferToOtherBookstore = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 50, isDeleted: true})

    transferInicialToThirdBookstore = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: thirdInventory.id, quantity: 100, deliveryDate: new Date("2025-01-01")})
    extraTransferToThirdBookstore = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50})
    deletedTransferToThirdBookstore = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: thirdInventory.id, quantity: 50, isDeleted: true})

    transferInicialToOtherThirdBookstoreInventory = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherThirdBookstoreInventory.id, quantity: 10, deliveryDate: new Date("2025-01-01")})
    extraTransferToOtherThirdBookstoreInventory = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherThirdBookstoreInventory.id, quantity: 5})
    deletedTransferToOtherThirdBookstoreInventory = await createTransfer(prisma, otherWasInventory.id, {toInventoryId: otherThirdBookstoreInventory.id, quantity: 50, isDeleted: true})

    // entregadosDelAutorWas = await createImpression(prisma, book.id, {quantity: 10, authorDelivery: true})
    // entregadosDelAutorOtherWas = await createImpression(prisma, book.id, {quantity: 10, authorDelivery: true})

    entregadosAlAutorWas = await createTransfer(prisma, wasInventory.id, {quantity: 2})
    entregadosAlAutorOtherWas = await createTransfer(prisma, otherWasInventory.id, {quantity: 2})

    entregadosDelAutorWas = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1})
    entregadosDelAutorOtherWas = await createTransfer(prisma, null, {toInventoryId: otherWasInventory.id, quantity: 1})
    
    saleWas = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 10})
    saleOtherWas = await createSale(prisma, otherWasInventory.id, [payment.id], {quantity: 10})

    saleOtherBookstore = await createSale(prisma, otherBookstore.id, [payment.id], {quantity: 10})
    saleThirdBookstore = await createSale(prisma, thirdBookstore.id, [payment.id], {quantity: 10})

    saleOtherBookstore2 = await createSale(prisma, otherBookstore.id, [payment.id], {quantity: 5})
    saleThirdBookstore2 = await createSale(prisma, thirdBookstore.id, [payment.id], {quantity: 3})

    saleOtherThirdBookstore = await createSale(prisma, otherThirdBookstoreInventory.id, [payment.id], {quantity: 3})
    deletedSaleOtherThirdBookstore = await createSale(prisma, otherThirdBookstoreInventory.id, [payment.id], {quantity: 10, isDeleted: true})

    returnOtherBookstore = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 3})
    returnThirdBookstore = await createTransfer(prisma, thirdInventory.id, {toInventoryId: otherWasInventory.id, quantity: 3})
    returnOtherThirdBookstore = createTransfer(prisma, otherThirdBookstoreInventory.id, {toInventoryId: wasInventory.id, quantity: 2})

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

  it(`getInventoriesByBookstores should be an array of length 3`, async() => {
    await getInventoriesByBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    jsonResponse = mockRes.json.mock.calls[0][0];

    expect(Array.isArray(jsonResponse)).toBeTruthy()
    expect(jsonResponse.length).toBe(3)
  })

  it(`should get the WAS numbers correctly`, async() => {
    const wasCondensed = jsonResponse.find(el => el.name === "WAS Editorial")
    expect(wasCondensed.name).toBe("WAS Editorial")
    expect(wasCondensed.copias).toBe(387)
    expect(wasCondensed.impressionInicial).toBe(400)
    expect(wasCondensed.extraImpressions).toBe(300)
    expect(wasCondensed.returns).toBe(8)
    expect(wasCondensed.transfers).toBe(315)
    expect(wasCondensed.entregadosDelAutor).toBe(2)
    expect(wasCondensed.entregadosAlAutor).toBe(4)
    expect(wasCondensed.ventas).toBe(20)
    expect(wasCondensed.disponibles).toBe(371)
    expect(wasCondensed.id).toBe(1)
  })

  it(`should get the numbers for Other Bookstore correct too`, async() => {
    const otherInventoryProcessed = jsonResponse.find(el => el.name === otherBookstore.name)
    expect(otherInventoryProcessed.name).toBe(otherBookstore.name)
    expect(otherInventoryProcessed.transferInicial).toBe(100)
    expect(otherInventoryProcessed.extraTransfers).toBe(50)
    expect(otherInventoryProcessed.copias).toBe(150)
    expect(otherInventoryProcessed.returns).toBe(3)
    expect(otherInventoryProcessed.ventas).toBe(15)
    expect(otherInventoryProcessed.disponibles).toBe(132)
    expect(otherInventoryProcessed.id).not.toBe(1)
  })

  it(`should get the numbers for Third Bookstore correct too`, async() => {
    const thirdInventoryProcessed = jsonResponse.find(el => el.name === thirdBookstore.name)
    expect(thirdInventoryProcessed.name).toBe(thirdBookstore.name)
    expect(thirdInventoryProcessed.transferInicial).toBe(110)
    expect(thirdInventoryProcessed.extraTransfers).toBe(55)
    expect(thirdInventoryProcessed.copias).toBe(165)
    expect(thirdInventoryProcessed.returns).toBe(5)
    expect(thirdInventoryProcessed.ventas).toBe(16)
    expect(thirdInventoryProcessed.disponibles).toBe(144)
    expect(thirdInventoryProcessed.id).not.toBe(1)
  })
})