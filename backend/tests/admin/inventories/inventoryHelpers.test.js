import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getTotalSales,
  getTotalWasImpressions,
  getTotalWasTransfers,
  getNonWasTransfers,
  getGivenToAuthor,
  getWasInventory,
  getOtherInventory
} from "../../../routes/admin/inventories/inventoryHelpers.js";
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


describe("counts the sales for each inventory correctly", () => {
  let category;
  let author;
  let book;
  let wasBookstore, otherBookstore, otherBookstore2;
  let wasInventory, otherInventory, otherInventory2;
  let payment;
  let wasSale1, wasSale2, wasSale3, deletedWasSale;
  let otherSale1, otherSale2, otherSale3, deletedOtherSale;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    otherBookstore2 = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id)
    otherInventory2 = await createInventory(prisma, book.id, otherBookstore2.id)
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));
    wasSale1 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 5})
    wasSale2 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 7})
    wasSale3 = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 9})
    deletedWasSale = await createSale(prisma, wasInventory.id, [payment.id], {quantity: 9, isDeleted: true})
    otherSale1 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 4})
    otherSale2 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 6})
    otherSale3 = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 8})
    deletedOtherSale = await createSale(prisma, otherInventory.id, [payment.id], {quantity: 9, isDeleted: true})
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

  it(`should return 21 for the WAS inventory`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: wasInventory.id
      },
      include: {
        sales: true
      }
    })
    const res = getTotalSales(inventory)
    expect(res).toEqual(21)
  })

  it(`should return 18 for the other inventory`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: otherInventory.id
      },
      include: {
        sales: true
      }
    })
    const res = getTotalSales(inventory)
    expect(res).toEqual(18)
  })

  it(`should return 0 for otherInventory2 (no sales)`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: otherInventory2.id
      },
      include: {
        sales: true
      }
    })
    const res = getTotalSales(inventory)
    expect(res).toEqual(0)
  })
})


describe("gets the impressions for a WAS inventory correctly", async() => {
  let category;
  let author;
  let book, book2;
  let impression1, impression2, impression3, deletedImpression;
  let entregadoDelAutor1, entregadoDelAutor2, entregadoDelAutor3, deletedEntregadoDelAutor;
  let wasBookstore;
  let wasInventory, otherInventory;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book2.id, wasBookstore.id);
    impression1 = await createImpression(prisma, book.id, {quantity: 100, date: new Date("2025-01-01")});
    impression2 = await createImpression(prisma, book.id, {quantity: 50, date: new Date()});
    impression3 = await createImpression(prisma, book.id, {quantity: 25, date: new Date()});
    deletedImpression = await createImpression(prisma, book.id, {quantity: 100, date: new Date("2024-01-01"), isDeleted: true});
    entregadoDelAutor1 = await createImpression(prisma, book.id, {quantity: 2, date: new Date(), authorDelivery: true});
    entregadoDelAutor2 = await createImpression(prisma, book.id, {quantity: 4, date: new Date(), authorDelivery: true});
    entregadoDelAutor3 = await createImpression(prisma, book.id, {quantity: 6, date: new Date(), authorDelivery: true});
    deletedEntregadoDelAutor = await createImpression(prisma, book.id, {quantity: 2, date: new Date(), isDeleted: true, authorDelivery: true});
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

  it(`correctly returns the right impressions number`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: wasInventory.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        }
      }
    })
    const res = getTotalWasImpressions(inventory);
    expect(res.impressionInicial).toEqual(100)
    expect(res.extraImpressions).toEqual(75)
    expect(res.entregadosDelAutor).toEqual(12)
  })

  it(`correctly prints an error when there are no impressions`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: otherInventory.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        }
      }
    })
    const res = getTotalWasImpressions(inventory);
    expect(res.impressionInicial).toEqual(0)
    expect(res.extraImpressions).toEqual(0)
    expect(res.entregadosDelAutor).toEqual(0)
  })
})


describe("get the transfers for a was inventory", async() => {
  let category;
  let author;
  let book, book2;
  let wasBookstore, otherBookstore, thirdBookstore;
  let wasInventory, otherInventory, thirdInventory;
  let transfer1, transfer2, transfer3, deletedTransfer;
  let return1, return2, return3, deletedReturn;
  let entregaAlAutor1, entregaAlAutor2, entregaAlAutor3, deletedEntregaAlAutor;

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

  it(`returns the correct number for transfers, deliveries to the author and returns, not taking into account deleted`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: wasInventory.id
      },
      include: {
        transfersFrom: true,
        transfersTo: true
      }
    })
    const res = getTotalWasTransfers(inventory)
    expect(res.transfers).toBe(17)
    expect(res.entregadosAlAutor).toBe(27)
    expect(res.returns).toBe(20)
  })

  it(`should not crash on 0 transfersFrom or transfersTo`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: thirdInventory.id
      },
      include: {
        transfersFrom: true,
        transfersTo: true
      }
    }) 
    const res = getTotalWasTransfers(inventory)
    expect(res.transfers).toBe(0)
    expect(res.entregadosAlAutor).toBe(0)
    expect(res.returns).toBe(0)
  })
})


describe(`getNonWasTransfers return the correct values`, async() => {
  let category;
  let author;
  let book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;

  let transferTo;
  let transferTo2;
  let transferTo3;
  let deletedTransferTo;
  let transferFrom;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id)
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id)

    transferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 10})
    transferTo2 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5})
    transferTo3 = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 2})
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, {toInventoryId: otherInventory.id, quantity: 5, isDeleted: true})
    transferFrom = await createTransfer(prisma, otherInventory.id, {toInventoryId: wasInventory.id, quantity: 2})
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

  it(`should return the correct values`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {id: otherInventory.id},
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    const results = getNonWasTransfers(inventory)
    expect(results.transferInicial).toBe(10)
    expect(results.extraTransfers).toBe(7)
    expect(results.returns).toBe(2)
  })
})


describe("getGivenToAuthor returns the correct number", async() => {
  let category;
  let author;
  let book, book2;
  let bookstore;
  let inventory1, inventory2;

  let transfer, deletedTransfer, transfer2;
  let transfer3, transfer4, transfer5, deletedTransfer2;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book2.id, bookstore.id)

    transfer = await createTransfer(prisma, inventory1.id, {quantity: 10})
    deletedTransfer = await createTransfer(prisma, inventory1.id, {quantity: 10, isDeleted: true})
    transfer2 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10})

    transfer3 = await createTransfer(prisma, inventory2.id, {quantity: 7})
    transfer4 = await createTransfer(prisma, inventory2.id, {quantity: 7})
    transfer5 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10})
    deletedTransfer2 = await createTransfer(prisma, inventory2.id, {quantity: 7, isDeleted: true})
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

  it(`should return the correct value of given to author for inventory1`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {id: inventory1.id},
      include: {transfersFrom : true}
    })
    const res = getGivenToAuthor(inventory)
    expect(res).toBe(10)
  })

  it(`should return the correct value of given to author for inventory2`, async() => {
    const inventory = await prisma.inventory.findUnique({
      where: {id: inventory2.id},
      include: {transfersFrom: true}
    })
    const res = getGivenToAuthor(inventory)
    expect(res).toBe(14)
  })
})


describe("getWasInventory returns the correct values", async () => {
  let category, author, book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let impression, impression2, impression3, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, deletedTransferTo;
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;

  beforeAll(async () => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // impressions
    impression = await createImpression(prisma, book.id, { quantity: 500, date: new Date("2025-01-01") });
    impression2 = await createImpression(prisma, book.id, { quantity: 100 });
    impression3 = await createImpression(prisma, book.id, { quantity: 50 });
    deletedImpression = await createImpression(prisma, book.id, { quantity: 500, isDeleted: true });
    entregadoDelAutor = await createImpression(prisma, book.id, { quantity: 10, authorDelivery: true });
    deletedEntregadoDelAutor = await createImpression(prisma, book.id, { quantity: 5, authorDelivery: true, isDeleted: true });

    // transfers out
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });

    // entregado al autor
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2 });
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2, isDeleted: true });

    // return from other back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    // sales
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 4, isDeleted: true });
  });

  afterAll(async () => {
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
    `);
  });

  // impressionInicial = 500, extraImpressions = 150, entregadosDelAutor = 10
  // transfers = 150, entregadosAlAutor = 2, returns = 20
  // ventas = 3
  // copias = 500 + 150 + 10 - 150 = 510
  // disponibles = 510 - 3 + 20 - 2 = 525

  let results;

  beforeAll(async () => {
    const inventory = await prisma.inventory.findUnique({
      where: { id: wasInventory.id },
      include: {
        sales: true,
        transfersFrom: true,
        transfersTo: true,
        book: {
          include: {
            impressions: true
          }
        }
      }
    });
    results = getWasInventory(inventory);
  });

  it("should return an object with the expected keys", () => {
    const expectedKeys = [
      "copias", "impressionInicial", "extraImpressions", "returns",
      "transfers", "entregadosDelAutor", "entregadosAlAutor", "ventas", "disponibles"
    ];
    for (const key of expectedKeys) {
      expect(results).toHaveProperty(key);
    }
  });

  it("should return the correct impressionInicial", () => {
    expect(results.impressionInicial).toBe(500);
  });

  it("should return the correct extraImpressions", () => {
    expect(results.extraImpressions).toBe(150);
  });

  it("should return the correct entregadosDelAutor", () => {
    expect(results.entregadosDelAutor).toBe(10);
  });

  it("should return the correct transfers", () => {
    expect(results.transfers).toBe(150);
  });

  it("should return the correct entregadosAlAutor", () => {
    expect(results.entregadosAlAutor).toBe(2);
  });

  it("should return the correct returns", () => {
    expect(results.returns).toBe(20);
  });

  it("should return the correct ventas", () => {
    expect(results.ventas).toBe(3);
  });

  it("should return the correct copias", () => {
    expect(results.copias).toBe(510);
  });

  it("should return the correct disponibles", () => {
    expect(results.disponibles).toBe(525);
  });

  it("copias should be internally consistent", () => {
    expect(results.copias).toBe(
      results.impressionInicial +
      results.extraImpressions +
      results.entregadosDelAutor -
      results.transfers
    );
  });

  it("disponibles should be internally consistent", () => {
    expect(results.disponibles).toBe(
      results.copias -
      results.ventas +
      results.returns -
      results.entregadosAlAutor
    );
  });
});


describe("getOtherInventory returns the correct values", async () => {
  let category, author, book;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let payment;

  let transferTo, transferTo2, transferTo3, deletedTransferTo;
  let transferFrom;
  let sale1, sale2, deletedSale;

  beforeAll(async () => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    wasBookstore = await createBookstore(prisma);
    otherBookstore = await createBookstore(prisma);
    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // transfers in from WAS
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    transferTo3 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 20 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });

    // return back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    // sales
    sale1 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 4, isDeleted: true });
  });

  afterAll(async () => {
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
    `);
  });

  // transferInicial = 100, extraTransfers = 70, returns = 20, ventas = 3
  // copias = 100 + 70 = 170
  // disponibles = 170 - 20 - 3 = 147

  let results;

  beforeAll(async () => {
    const inventory = await prisma.inventory.findUnique({
      where: { id: otherInventory.id },
      include: {
        sales: true,
        transfersTo: true,
        transfersFrom: true,
      }
    });
    results = getOtherInventory(inventory);
  });

  it("should return an object with the expected keys", () => {
    const expectedKeys = ["copias", "inicial", "extraTransfers", "returns", "ventas", "disponibles"];
    for (const key of expectedKeys) {
      expect(results).toHaveProperty(key);
    }
  });

  it("should return the correct inicial", () => {
    expect(results.inicial).toBe(100);
  });

  it("should return the correct extraTransfers", () => {
    expect(results.extraTransfers).toBe(70);
  });

  it("should return the correct returns", () => {
    expect(results.returns).toBe(20);
  });

  it("should return the correct ventas (deleted excluded)", () => {
    expect(results.ventas).toBe(3);
  });

  it("should return the correct copias", () => {
    expect(results.copias).toBe(170);
  });

  it("should return the correct disponibles", () => {
    expect(results.disponibles).toBe(147);
  });

  it("copias should be internally consistent", () => {
    expect(results.copias).toBe(results.inicial + results.extraTransfers);
  });

  it("disponibles should be internally consistent", () => {
    expect(results.disponibles).toBe(results.copias - results.returns - results.ventas);
  });
});
