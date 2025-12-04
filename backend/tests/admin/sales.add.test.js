import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import { addSale } from "../../routes/adminRoutes.js";
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



async function seed() {
  let newAuthor = await createAuthor(prisma);

  let newBook = await createBook(prisma, [newAuthor.id]);
  let newBook2 = await createBook(prisma, [newAuthor.id]);
  let newBook3 = await createBook(prisma, [newAuthor.id]);
  let newBook4 = await createBook(prisma, [newAuthor.id]);
  let newBook5 = await createBook(prisma, [newAuthor.id]);

  let deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});

  let newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is the note", date: new Date("2025-10-29")});
  let newImpression2 = await createImpression(prisma, newBook.id, {quantity: 1000});
  let newImpression3 = await createImpression(prisma, newBook.id, {quantity: 1000});
  let deletedImpression = await createImpression(prisma, newBook.id, {quantity: 100, isDeleted: true});

  let newBookstore = await createBookstore(prisma);
  let newBookstore2 = await createBookstore(prisma);
  let newBookstore3 = await createBookstore(prisma);
  let newBookstore4 = await createBookstore(prisma);
  let deletedBookstore = await createBookstore(prisma, {isDeleted: true});

  let deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000, isDeleted: true});
  let newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 0, givenToAuthor: 0});
  let newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, {initial: 3000, current: 3000, isDeleted: true, returns: 0, givenToAuthor: 0});
  let newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: true, returns: 10, givenToAuthor: 10});
  let newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2025-11-02")));
  let previousPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2025-09-02")));
  let oldPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2024-01-01")));

  let deletedSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
  let newSale1 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
  let newSale2 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
  let newSale3 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
  let newSale4 = await createSale(prisma, newInventory2.id, [newPayment.id], {quantity: 100});
  let oldSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, date: new Date("2024-01-01")});

  const testDBObjects = {
    newAuthor:       { type: "author", data: newAuthor },

    newBook:         { type: "book", data: newBook },
    newBook2:        { type: "book", data: newBook2 },
    newBook3:        { type: "book", data: newBook3 },
    newBook4:        { type: "book", data: newBook4 },
    newBook5:        { type: "book", data: newBook5 },

    deletedBook:     { type: "book", data: deletedBook },

    newImpression:   { type: "impression", data: newImpression },
    newImpression2:  { type: "impression", data: newImpression2 },
    newImpression3:  { type: "impression", data: newImpression3 },
    deletedImpression:{ type: "impression", data: deletedImpression },

    newBookstore:    { type: "bookstore", data: newBookstore },
    newBookstore2:   { type: "bookstore", data: newBookstore2 },
    newBookstore3:   { type: "bookstore", data: newBookstore3 },
    newBookstore4:   { type: "bookstore", data: newBookstore4 },
    deletedBookstore:{ type: "bookstore", data: deletedBookstore },

    deletedInventory:{ type: "inventory", data: deletedInventory },
    newInventory:    { type: "inventory", data: newInventory },
    newInventory2:   { type: "inventory", data: newInventory2 },
    newInventory3:   { type: "inventory", data: newInventory3 },
    newInventory4:   { type: "inventory", data: newInventory4 },
    newInventory5:   { type: "inventory", data: newInventory5 },
    newInventory6:   { type: "inventory", data: newInventory6 },
    newInventory7:   { type: "inventory", data: newInventory7 },

    newPayment:      { type: "payment", data: newPayment },
    previousPayment: { type: "payment", data: previousPayment},
    oldPayment:      { type: "payment", data: oldPayment },
 
    deletedSale:     { type: "sale", data: deletedSale },
    newSale1:        { type: "sale", data: newSale1 },
    newSale2:        { type: "sale", data: newSale2 },
    newSale3:        { type: "sale", data: newSale3 },
    newSale4:        { type: "sale", data: newSale4 },
    oldSale:         { type: "sale", data: oldSale },
  };
  return testDBObjects
}

async function reap(testDBObjects) {
  const deletionList = [
    "oldSale", "newSale1", "newSale2", "newSale3", "newSale4", "deletedSale",
    "oldPayment", "previousPayment", "newPayment", "deletedPayment",
    'newInventory8', "newInventory7", "newInventory6", "newInventory5", "newInventory4",
    "newInventory3", "newInventory2", "newInventory", "deletedInventory",
    "deletedBookstore", "newBookstore4", "newBookstore3", "newBookstore2",
    "newBookstore",
    "deletedImpression", "newImpression3", "newImpression2", "newImpression",
    "deletedBook", "newBook6", "newBook5", "newBook4", "newBook3", "newBook2", "newBook",
    "newAuthor2", "newAuthor", 
  ];
  for (const item of deletionList) {
    const obj = testDBObjects[item];
    if (!obj) continue;
    await deleteFromDB(prisma, obj.data, obj.type);
    // console.log(`deleted ${obj.type}`);
  }
}



describe("adding a valid sale", () => {
  let testDBObjects, createdSale;
  let mockReq, mockRes;
  let createdPayment, invCreatedSale;

  beforeAll(async() => {
    testDBObjects = await seed();
    mockReq = {
      body: {
        "bookId": testDBObjects.newBook.data.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, createdPayment, "payment");
    await reap(testDBObjects);
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it(`should create a sale in the database`, async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it(`should create a new Payment if no payments exist for this specific month`, async() => {
    createdPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth(new Date("2024-11-22"))
        }
      }
    })
    expect(createdPayment).toBeTruthy();
  })

  it(`should have correct data`, async() => {
    invCreatedSale = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: testDBObjects.newBook.data.id,
          bookstoreId: testDBObjects.newBookstore.data.id
        }
      }
    })

    expect(createdSale.inventoryId).toBe(invCreatedSale.id);
    expect(createdSale.quantity).toBe(100);
    expect(createdSale.date).toEqual(new Date("2024-11-22"));
  })

  it(`should update the inventory tied to the sale`, async() => {
    expect(invCreatedSale.current).toBe(2900);
  })
})


describe("adding a sale for a multi-authors book", async() => {
  let testDBObjects, createdSale;
  let mockReq, mockRes;
  let newAuthor2, newBook6, newInventory8;
  let newPayments;

  beforeAll(async() => {
    newAuthor2 = await createAuthor(prisma);
    testDBObjects = await seed();
    newBook6 = await createBook(prisma, [testDBObjects.newAuthor.data.id, newAuthor2.id]);
    newInventory8 = await createInventory(prisma, newBook6.id, testDBObjects.newBookstore.data.id, {initial: 3000, current: 3000});

    mockReq = {
      body: {
        "bookId": newBook6.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, newPayments[0], "payment");
    await deleteFromDB(prisma, newPayments[1], "payment");
    await deleteFromDB(prisma, newInventory8, "inventory");
    await deleteFromDB(prisma, newBook6, "book");
    await deleteFromDB(prisma, newAuthor2, "author")
    await reap(testDBObjects);
  })

  it(`should create a new Payment for every author of the book if it does not exist`, async() => {
    await addSale(mockReq, mockRes)
    createdSale = mockRes.json.mock.calls[0][0]
    newPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [testDBObjects.newAuthor.data.id, newAuthor2.id]
        },
        forMonth: "2024-11"
      }
    });

    expect(newPayments.length).toBe(2);
    expect(createdSale.payments[0].id).toEqual(newPayments[0].id);
    expect(createdSale.payments[1].id).toEqual(newPayments[1].id);
  })
})


describe("adding a sale larger than the remaining inventory", async() => {
  let testDBObjects;
  let mockReq, mockRes, mute;
  let createdSale, createdPayment;
  let newAuthor2, newBook6, newInventory9;

  beforeAll(async() => {
    newAuthor2 = await createAuthor(prisma);
    testDBObjects = await seed();
    newBook6 = await createBook(prisma, [testDBObjects.newAuthor.data.id, newAuthor2.id]);
    newInventory9 = await createInventory(prisma, newBook6.id, testDBObjects.newBookstore2.data.id, {initial: 50, current:50});

    mockReq = {
      body: {
        "bookId": newBook6.id,
        "bookstoreId": testDBObjects.newBookstore2.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
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
    await deleteFromDB(prisma, createdPayment, "payment");
    await deleteFromDB(prisma, newInventory9, "inventory");
    await deleteFromDB(prisma, newBook6, "book");
    await deleteFromDB(prisma, newAuthor2, "author")
    await reap(testDBObjects);
    mute.mockRestore()
  })

  it(`should not create a new sale if the inventory doesn't have enough books`, async() => {
    await addSale(mockReq, mockRes)
    createdSale = mockRes.json.mock.calls[0][0];
    createdPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    });

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(createdSale).toEqual({ message: "El inventario tiene menos libros disponibles que la cantidad entrada."})
  })
})



describe("adding a sale but the payment is deleted", async() => {
  let testDBObjects;
  let mockReq, mockRes, mute;
  let createdSale, createdPayment, oldPayment;
  let deletedPayment;

  beforeAll(async() => {
    testDBObjects = await seed();
    deletedPayment = await createPayment(
      prisma, 
      testDBObjects.newAuthor.data.id, 
      getForMonth(new Date("2025-10-04")), 
      {isDeleted: true}
    );

    mockReq = {
      body: {
        "bookId": testDBObjects.newBook.data.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2025-10-04"),
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    oldPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    })

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, createdPayment, "payment");
    // await deleteFromDB(prisma, deletedPayment, "payment");
    await reap(testDBObjects);
    mute.mockRestore()
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it(`should create a sale in the database`, async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it(`should destroy and recreate the payment`, async() => {
    expect(oldPayment.isDeleted).toBe(true);
    createdPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    });
    expect(createdPayment.isDeleted).toBe(false);
  })
})