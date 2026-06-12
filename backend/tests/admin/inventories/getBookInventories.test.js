import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getOtherInventoryForThisBook,
  getWasInventoryForThisBook,
  getBookInventory
} from "../../../routes/admin/inventories/getBookInventories.js";
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

describe("getOtherInventoryForThisBook returns the correct values", async() => {
  let result;
  let category;
  let author;
  let book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let transferTo, transferTo2, transferTo3, deletedTransferTo;
  let transferFrom;
  let sale1, sale2, deletedSale;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // inicial transfer (first/largest)
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    // extra transfers
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    transferTo3 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 20 });
    // deleted — should be excluded
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });
    // return from otherBookstore back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    sale1 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 4, isDeleted: true });

    // Fetch the inventory in the same shape that getBookInventory would pass to this function
    const fetchedInventory = await prisma.inventory.findFirst({
      where: { id: otherInventory.id, isDeleted: false },
      select: {
        id: true,
        bookstoreId: true,
        bookstore: { select: { name: true } },
        bookId: true,
        book: {
          select: {
            title: true,
            impressions: {
              where: { isDeleted: false },
              orderBy: { date: "asc" },
              select: { id: true, quantity: true, note: true, date: true, authorDelivery: true }
            }
          }
        },
        sales: {
          where: { isDeleted: false },
          select: { quantity: true }
        },
        transfersFrom: {
          where: { isDeleted: false },
          select: { quantity: true, toInventoryId: true, fromInventoryId: true }
        },
        transfersTo: {
          where: { isDeleted: false },
          select: { quantity: true, toInventoryId: true, fromInventoryId: true }
        }
      }
    });

    result = getOtherInventoryForThisBook(fetchedInventory);
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Inventory",
        "Transfer",
        "Sale",
        "Impression",
        "Book",
        "Bookstore",
        "Category"
      RESTART IDENTITY CASCADE;
    `)
  })

  // Expected derived values:
  // inicial        = 100  (first transfer in)
  // extraTransfers = 70   (50 + 20)
  // copias         = 170  (100 + 70)
  // returns        = 20   (transfer back to WAS)
  // ventas         = 3    (2 + 1, deleted excluded)
  // disponibles    = 147  (170 - 20 - 3)

  it(`should return an object containing 14 keys: name, copias, inicial, extraTransfers, returns, entregadosAlAutor, entregadosDelAutor, ventas, disponibles, bookId, bookstoreId, id, wasRed`, () => {
    expect(Object.keys(result)).toHaveLength(14);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('copias');
    expect(result).toHaveProperty('inicial');
    expect(result).toHaveProperty('extraTransfers');
    expect(result).toHaveProperty('returns');
    expect(result).toHaveProperty('entregadosAlAutor');
    expect(result).toHaveProperty('entregadosDelAutor');
    expect(result).toHaveProperty('ventas');
    expect(result).toHaveProperty('disponibles');
    expect(result).toHaveProperty('bookstoreId');
    expect(result).toHaveProperty('bookId');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('wasRed');
  })

  it(`should return the correct values for each key`, () => {
    expect(result.name).toBe(otherBookstore.name);
    expect(result.title).toBe(book.title);
    expect(result.bookstoreId).toBe(otherBookstore.id);
    expect(result.bookId).toBe(book.id);
    expect(result.id).toBe(otherInventory.id);
    expect(result.inicial).toBe(100);
    expect(result.extraTransfers).toBe(70);
    expect(result.copias).toBe(170);
    expect(result.returns).toBe(20);
    expect(result.ventas).toBe(3);
    expect(result.disponibles).toBe(147);
  })

  it(`copias and disponibles should be internally consistent`, () => {
    expect(result.inicial + result.extraTransfers).toBe(result.copias);
    expect(result.copias - result.returns - result.ventas).toBe(result.disponibles);
  })
})



describe("getWasInventoryForThisBook returns the correct values", async() => {
  let result;
  let category;
  let author;
  let book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, transferTo3, deletedTransferTo;
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // Impressions (on the book, not the inventory)
    impression = await createImpression(prisma, book.id, { quantity: 500, date: new Date("2025-01-01") }); // inicial
    impression2 = await createImpression(prisma, book.id, { quantity: 100 });                              // extra
    impression3 = await createImpression(prisma, book.id, { quantity: 50 });                               // extra
    deletedImpression = await createImpression(prisma, book.id, { quantity: 500, isDeleted: true });       // excluded
    // entregadoDelAutor = await createImpression(prisma, book.id, { quantity: 10, authorDelivery: true });
    // deletedEntregadoDelAutor = await createImpression(prisma, book.id, { quantity: 5, authorDelivery: true, isDeleted: true }); // excluded

    // Transfers out to otherInventory
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    transferTo3 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 20 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true }); // excluded
    
    // entregado al autor (no toInventoryId)
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2 });
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2, isDeleted: true }); // excluded

    // entregado del autor 
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})
    
    // return from otherInventory back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    sale1 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 4, isDeleted: true }); // excluded

    // Fetch the inventory in the same shape that getBookInventory would pass to this function
    const fetchedInventory = await prisma.inventory.findFirst({
      where: { id: wasInventory.id, isDeleted: false },
      select: {
        id: true,
        bookstoreId: true,
        bookstore: { select: { name: true } },
        bookId: true,
        book: {
          select: {
            title: true,
            impressions: {
              where: { isDeleted: false },
              orderBy: { date: "asc" },
              select: { id: true, quantity: true, note: true, date: true, authorDelivery: true }
            }
          }
        },
        sales: {
          where: { isDeleted: false },
          select: { quantity: true }
        },
        transfersFrom: {
          where: { isDeleted: false },
          select: { quantity: true, toInventoryId: true, fromInventoryId: true }
        },
        transfersTo: {
          where: { isDeleted: false },
          select: { quantity: true, toInventoryId: true, fromInventoryId: true }
        }
      }
    });

    result = getWasInventoryForThisBook(fetchedInventory);
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Inventory",
        "Transfer",
        "Sale",
        "Impression",
        "Book",
        "Bookstore",
        "Category"
      RESTART IDENTITY CASCADE;
    `)
  })

  // Expected derived values:
  // inicial            = 500
  // extraImpressions   = 150  (100 + 50, deleted excluded)
  // entregadosDelAutor = 1   (deleted excluded)
  // transfers          = 170  (100 + 50 + 20, deleted excluded)
  // entregadosAlAutor  = 2    (deleted excluded)
  // returns            = 20
  // copias             = 500 + 150 + 1 - 170 = 481
  // ventas             = 3    (2 + 1, deleted excluded)
  // disponibles        = 481 - 3 + 20 - 2 = 496

  it(`should return an object containing 15 keys: 
    name, title, copias, inicial, extraImpressions, returns, 
    transfers, entregadosDelAutor, entregadosAlAutor, 
    ventas, disponibles, bookstoreId, id, thatBookimpressions, bookId`, () => {
    expect(Object.keys(result)).toHaveLength(15);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('copias');
    expect(result).toHaveProperty('inicial');
    expect(result).toHaveProperty('extraImpressions');
    expect(result).toHaveProperty('returns');
    expect(result).toHaveProperty('transfers');
    expect(result).toHaveProperty('entregadosDelAutor');
    expect(result).toHaveProperty('entregadosAlAutor');
    expect(result).toHaveProperty('ventas');
    expect(result).toHaveProperty('disponibles');
    expect(result).toHaveProperty('bookstoreId');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('thatBookImpressions');
    expect(result).toHaveProperty('bookId');
  })

  it(`should return the correct values for each key`, () => {
    expect(result.name).toBe(wasBookstore.name);
    expect(result.title).toBe(book.title);
    expect(result.bookstoreId).toBe(wasBookstore.id);
    expect(result.id).toBe(wasInventory.id);
    expect(result.bookId).toBe(book.id);
    expect(result.inicial).toBe(500);
    expect(result.extraImpressions).toBe(150);
    expect(result.entregadosDelAutor).toBe(1);
    expect(result.transfers).toBe(170);
    expect(result.entregadosAlAutor).toBe(2);
    expect(result.returns).toBe(20);
    expect(result.copias).toBe(481);
    expect(result.ventas).toBe(3);
    expect(result.disponibles).toBe(496);
  })

  it(`should return a list of all impressions for this inventory - objects with 5 keys:
    authorDelivery, date, id, note, quantity`, () => {
    const impressions = result.thatBookImpressions;
    expect(Array.isArray(impressions)).toBe(true);
    // entregadoDelAutor impression is excluded, deleted impression is excluded
    // leaving impression (500), impression2 (100), impression3 (50)
    expect(impressions).toHaveLength(3);
    for (const impression of impressions) {
      expect(Object.keys(impression)).toHaveLength(5);
      expect(impression).toHaveProperty('authorDelivery');
      expect(impression).toHaveProperty('date');
      expect(impression).toHaveProperty('id');
      expect(impression).toHaveProperty('note');
      expect(impression).toHaveProperty('quantity');
    }
  })

  it(`the values for each impression should be correct`, () => {
    const impressions = result.thatBookImpressions;
    const imp1 = impressions.find(i => i.id === impression.id);
    const imp2 = impressions.find(i => i.id === impression2.id);
    const imp3 = impressions.find(i => i.id === impression3.id);

    expect(imp1.quantity).toBe(500);
    expect(imp1.authorDelivery).toBe(false);

    expect(imp2.quantity).toBe(100);
    expect(imp2.authorDelivery).toBe(false);

    expect(imp3.quantity).toBe(50);
    expect(imp3.authorDelivery).toBe(false);

    // authorDelivery impression should not be present
    expect(impressions.find(i => i.id === entregadoDelAutor.id)).toBeUndefined();
  })

  it(`copias and disponibles should be internally consistent`, () => {
    const expectedCopias = result.inicial + result.extraImpressions + result.entregadosDelAutor - result.transfers;
    const expectedDisponibles = result.copias - result.ventas + result.returns - result.entregadosAlAutor;
    expect(expectedCopias).toBe(result.copias);
    expect(expectedDisponibles).toBe(result.disponibles);
  })
})



describe("getBookInventory returns the correct values", async() => {
  let mockReq, mockRes, results;
  let category;
  let author;
  let book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, transferTo3, deletedTransferTo;
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;
  let sale3, sale4, deletedSale2;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // WAS impressions
    impression = await createImpression(prisma, book.id, { quantity: 500, date: new Date("2025-01-01") });
    impression2 = await createImpression(prisma, book.id, { quantity: 100 });
    impression3 = await createImpression(prisma, book.id, { quantity: 50 });
    deletedImpression = await createImpression(prisma, book.id, { quantity: 500, isDeleted: true });
    // entregadoDelAutor = await createImpression(prisma, book.id, { quantity: 10, authorDelivery: true });
    // deletedEntregadoDelAutor = await createImpression(prisma, book.id, { quantity: 5, authorDelivery: true, isDeleted: true });

    // WAS transfers out to otherInventory
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    transferTo3 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 20 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });
    // entregado al autor (no toInventoryId)
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2 });
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2, isDeleted: true });
    // entregado del autor 
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 1})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 10, isDeleted: true})
    // return from otherInventory back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    // WAS sales
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 4, isDeleted: true });

    // otherInventory sales
    sale3 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 2 });
    sale4 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 1 });
    deletedSale2 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 4, isDeleted: true });

    mockReq = {
      params: { id: book.id },
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
        "Impression",
        "Book",
        "Bookstore",
        "Category"
      RESTART IDENTITY CASCADE;
    `)
  })

  // WAS:
  //   inicial = 500, extraImpressions = 150, entregadosDelAutor = 10
  //   transfers = 170, entregadosAlAutor = 2, returns = 20
  //   copias = 490, ventas = 3, disponibles = 505
  // Other:
  //   inicial = 100, extraTransfers = 70, copias = 170
  //   returns = 20, ventas = 3, disponibles = 147
  // Total:
  //   copias = 660, ventas = 6, disponibles = 652

  it(`should return an object containing 2 keys: total and specifics`, async() => {
    await getBookInventory(mockReq, mockRes);
    results = mockRes.json.mock.calls[0][0];
    expect(Object.keys(results)).toHaveLength(2);
    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('specifics');
  })

  it(`specifics should be a list with one entry per bookstore inventory`, () => {
    expect(Array.isArray(results.specifics)).toBe(true);
    expect(results.specifics).toHaveLength(2);
  })

  it(`should return the correct values for the WAS specific inventory`, () => {
    const was = results.specifics.find(el => el.bookstoreId === wasBookstore.id);
    expect(was.name).toBe(wasBookstore.name);
    expect(was.inicial).toBe(500);
    expect(was.extraImpressions).toBe(150);
    expect(was.entregadosDelAutor).toBe(1);
    expect(was.transfers).toBe(170);
    expect(was.entregadosAlAutor).toBe(2);
    expect(was.returns).toBe(20);
    expect(was.copias).toBe(481);
    expect(was.ventas).toBe(3);
    expect(was.disponibles).toBe(496);
  })

  it(`should return the correct values for the other bookstore specific inventory`, () => {
    const other = results.specifics.find(el => el.bookstoreId === otherBookstore.id);
    expect(other.name).toBe(otherBookstore.name);
    expect(other.inicial).toBe(100);
    expect(other.extraTransfers).toBe(70);
    expect(other.copias).toBe(170);
    expect(other.returns).toBe(20);
    expect(other.ventas).toBe(3);
    expect(other.disponibles).toBe(147);
  })

  it(`should return the correct values for total`, () => {
    const total = results.total;
    expect(total.name).toBe(book.title);
    expect(total.id).toBe(book.id);
    expect(total.copias).toBe(651);
    expect(total.impressionInicial).toBe(500);
    expect(total.extraImpressions).toBe(150);
    expect(total.entregadosDelAutor).toBe(1);
    expect(total.entregadosAlAutor).toBe(2);
    expect(total.ventas).toBe(6);
    expect(total.disponibles).toBe(643);
  })

  it(`total values should be internally consistent`, () => {
    const total = results.total;
    expect(total.copias).toBe(results.specifics.reduce((sum, s) => sum + s.copias, 0));
    expect(total.ventas).toBe(results.specifics.reduce((sum, s) => sum + s.ventas, 0));
    expect(total.disponibles).toBe(results.specifics.reduce((sum, s) => sum + s.disponibles, 0));
  })
})