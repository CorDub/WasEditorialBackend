import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import { deleteSale } from "../../routes/adminRoutes.js";
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



// DELETING
describe(`deleting a sale with valid parameters`, async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, testDBObjects.newBook.data.id, newBookstore100.id, {initial: 3000, current: 2900})
    newSale100 = await createSale(prisma, newInventory100.id, [testDBObjects.newPayment.data.id], {quantity: 100});

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      query: {
        "inventory_id": newInventory100.id,
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newSale100, "sale");
    await deleteFromDB(prisma, newInventory100, "inventory");
    await deleteFromDB(prisma, newBookstore100, "bookstore")
    await reap(testDBObjects);
  })

  it("should return a 200", async() => {
    await deleteSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the sale as deleted", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.isDeleted).toBe(true);
    
  })

  it("should return the quantity to the current inventory", async() => {
    expect(updatedInventory.current).toBe(3000);
  })
})