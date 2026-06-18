import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { 
  findEarliestDeliveryToAuthor,
  checkSendReturnOrder,
  checkDeliveryReturnOrder
} from "../../../routes/admin/transfers/transferHelpers.js";
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

afterAll(async() =>  {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe(`findEarliestDeliveryToAuthor - happey path`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let entrega1, entrega2, entrega3, deletedEntrega;
  let transfer;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    entrega1 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-16"});
    entrega2 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-16"});
    entrega3 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-12"});
    deletedEntrega = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-11", isDeleted: true});
    transfer = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11"});

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      },
      include: {
        transfersFrom: true
      }
    })
    res = findEarliestDeliveryToAuthor(inventoryWithTransfers)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("returns the correct date", async() => {
    expect(res).toStrictEqual("2026-06-12");
  })
})



describe(`findEarliestDeliveryToAuthor - no transfers Fom`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let entrega1, entrega2, entrega3, deletedEntrega;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    entrega1 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-16"});
    entrega2 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-16"});
    entrega3 = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-12"});
    deletedEntrega = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-11", isDeleted: true});
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should throw", async() => {
    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      }
    })
    expect(() => findEarliestDeliveryToAuthor(inventoryWithTransfers)).toThrow()
  })
})



describe(`findEarliestDeliveryToAuthor - no deliveriesToAuthor, only transfers`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let deletedEntrega;
  let transfer;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    deletedEntrega = await createTransfer(prisma, inventory.id, {quantity: 10, dateStr:"2026-06-11", isDeleted: true});
    transfer = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11"});
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should throw", async() => {
    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      }
    })
    expect(() => findEarliestDeliveryToAuthor(inventoryWithTransfers)).toThrow()
  })
})



describe(`checkSendReturnOrder - send - happy path`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: send1.id,
      dateStr: "2026-06-14",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true,
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkSendReturnOrder - send - wrong order`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: send1.id,
      dateStr: "2026-06-17",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return false", async() => {
    expect(res).toBe(false);
  })
})



describe(`checkSendReturnOrder - send - equality`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: send1.id,
      dateStr: "2026-06-16",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkSendReturnOrder - return - happy path`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: return1.id,
      dateStr: "2026-06-17",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkSendReturnOrder - return - wrong order`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: return1.id,
      dateStr: "2026-06-14",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return false", async() => {
    expect(res).toBe(false);
  })
})



describe(`checkSendReturnOrder - return - equality`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: return1.id,
      dateStr: "2026-06-15",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkSendReturnOrder - not WAS - equality`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send1;
  let deletedSend;
  let return1; 
  let deletedReturn;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-15"})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: return1.id,
      dateStr: "2026-06-15",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkSendReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkDeliveryReturnOrder - delivery - happy path`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: delivery1.id,
      dateStr: "2026-06-14",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkDeliveryReturnOrder - delivery - wrong order`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: delivery1.id,
      dateStr: "2026-06-17",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return false", async() => {
    expect(res).toBe(false);
  })
})



describe(`checkDeliveryReturnOrder - delivery - equality`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: delivery1.id,
      dateStr: "2026-06-16",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "send")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkDeliveryReturnOrder - devolucion - happy path`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: devolucion1.id,
      dateStr: "2026-06-17",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})



describe(`checkDeliveryReturnOrder - devolucion - wrong order`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: devolucion1.id,
      dateStr: "2026-06-14",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return false", async() => {
    expect(res).toBe(false);
  })
})



describe(`checkDeliveryReturnOrder - devolucion - equality`, () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let delivery1;
  let deletedDelivery;
  let devolucion1; 
  let deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);

    delivery1 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-15"})
    deletedDelivery = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr: "2026-06-11", isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-16"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 10, dateStr: "2026-06-10", isDeleted: true})

    const transferToBeEdited = {
      id: devolucion1.id,
      dateStr: "2026-06-15",
      quantity: 10
    }

    const inventoryWithTransfers = await prisma.inventory.findUnique({
      where: {
        id: inventory1.id
      },
      include: {
        transfersTo: true,
        transfersFrom: true
      }
    })
    res = checkDeliveryReturnOrder(inventoryWithTransfers, transferToBeEdited, "return")
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return true", async() => {
    expect(res).toBe(true);
  })
})