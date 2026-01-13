import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import {
  updateInventory
} from "../../routes/adminRoutes.js";
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



describe("updating an inventory with valid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    newBook3 = await createBook(prisma, [newAuthor.id]);
    newBook4 = await createBook(prisma, [newAuthor.id]);
    newBook5 = await createBook(prisma, [newAuthor.id]);
    deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, {quantity: 1000});
    newImpression3 = await createImpression(prisma, newBook.id, {quantity: 1000});
    deletedImpression = await createImpression(prisma, newBook.id, {quantity: 100, isDeleted: true});
    newBookstore = await createBookstore(prisma);
    newBookstore2 = await createBookstore(prisma);
    newBookstore3 = await createBookstore(prisma);
    newBookstore4 = await createBookstore(prisma);
    deletedBookstore = await createBookstore(prisma, {isDeleted: true});
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000, isDeleted: true});
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 1000});
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, {initial: 3000, current: 3000, returns: 0, givenToAuthor: 0, isDeleted: true});
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: true, returns:0, givenToAuthor: 0});
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale3 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [newPayment.id], {quantity: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockReq = {
      params: {
        id: newInventory.id
      }, 
      body: {
        book: newBook2.id,
        bookstore: newBookstore2.id,
        inicial: 1200,
        price: 459.99
      },
      prisma: prisma
    }
  })

  afterAll(async() => {
    if (deletedSale) {await deleteFromDB(prisma, deletedSale, "sale")};
    if (newSale1) {await deleteFromDB(prisma, newSale1, "sale")};
    if (newSale2) {await deleteFromDB(prisma, newSale2, "sale")};
    if (newSale3) {await deleteFromDB(prisma, newSale3, "sale")};
    if (newSale4) {await deleteFromDB(prisma, newSale4, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")};
    if (newInventory3) {await deleteFromDB(prisma, newInventory3, "inventory")};
    if (newInventory4) {await deleteFromDB(prisma, newInventory4, "inventory")};
    if (newInventory5) {await deleteFromDB(prisma, newInventory5, "inventory")};
    if (newInventory6) {await deleteFromDB(prisma, newInventory6, "inventory")};
    if (newInventory7) {await deleteFromDB(prisma, newInventory7, "inventory")};
    if (deletedInventory) {await deleteFromDB(prisma, deletedInventory, "inventory")};
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")};
    if (newBookstore2) {await deleteFromDB(prisma, newBookstore2, "bookstore")};
    if (newBookstore3) {await deleteFromDB(prisma, newBookstore3, "bookstore")};
    if (newBookstore4) {await deleteFromDB(prisma, newBookstore4, "bookstore")};
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (newImpression2) {await deleteFromDB(prisma, newImpression2, "impression")};
    if (newImpression3) {await deleteFromDB(prisma, newImpression3, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (newBook3) {await deleteFromDB(prisma, newBook3, "book")};
    if (newBook4) {await deleteFromDB(prisma, newBook4, "book")};
    if (newBook5) {await deleteFromDB(prisma, newBook5, "book")};
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 200 status", async() => {
    await updateInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should correctly update the inventory in the database", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}});
    expect(updatedInventory.bookId).toBe(newBook2.id)
    expect(updatedInventory.bookstoreId).toBe(newBookstore2.id)
    expect(updatedInventory.initial).toBe(1200)
    expect(updatedInventory.price).toBe(459.99)
  })

  it("should reduce current if current > initial after update", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}});
    expect(updatedInventory.current).toBe(1200)
  })

  it("should increase current by the difference if current < initial after update", async() => {
    const mockReq2 = {
      params: {
        id: newInventory2.id
      },
      body: {
        book: newBook2.id,
        bookstore: newBookstore3.id,
        inicial: 4000,
        price: 459.99
      },
      prisma: prisma
    };
    const mockRes2 = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    await updateInventory(mockReq2, mockRes2);
    const increasedInventory = await prisma.inventory.findUnique({where: {id: newInventory2.id}});
    expect(increasedInventory.current).toBe(4000);
  })
})

describe("updating an inventory with invalid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    newBook3 = await createBook(prisma, [newAuthor.id]);
    newBook4 = await createBook(prisma, [newAuthor.id]);
    newBook5 = await createBook(prisma, [newAuthor.id]);
    deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, {quantity: 1000});
    newImpression3 = await createImpression(prisma, newBook.id, {quantity: 1000});
    deletedImpression = await createImpression(prisma, newBook.id, {quantity: 100, isDeleted: true});
    newBookstore = await createBookstore(prisma);
    newBookstore2 = await createBookstore(prisma);
    newBookstore3 = await createBookstore(prisma);
    newBookstore4 = await createBookstore(prisma);
    deletedBookstore = await createBookstore(prisma, {isDeleted: true});
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000, isDeleted: true});
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 3000, current: 3000});
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, {initial: 3000, current: 3000, returns: 0, givenToAuthor: 0, isDeleted: true});
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: true, returns:0, givenToAuthor: 0});
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale3 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [newPayment.id], {quantity: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockReq = {
      params: {
        id: newInventory.id
      }, 
      body: {
        book: "yeah this isn't good",
        bookstore: newBookstore2.id,
        initial: -1200,
        price: 0
      },
      prisma: prisma
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    if (deletedSale) {await deleteFromDB(prisma, deletedSale, "sale")};
    if (newSale1) {await deleteFromDB(prisma, newSale1, "sale")};
    if (newSale2) {await deleteFromDB(prisma, newSale2, "sale")};
    if (newSale3) {await deleteFromDB(prisma, newSale3, "sale")};
    if (newSale4) {await deleteFromDB(prisma, newSale4, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")};
    if (newInventory3) {await deleteFromDB(prisma, newInventory3, "inventory")};
    if (newInventory4) {await deleteFromDB(prisma, newInventory4, "inventory")};
    if (newInventory5) {await deleteFromDB(prisma, newInventory5, "inventory")};
    if (newInventory6) {await deleteFromDB(prisma, newInventory6, "inventory")};
    if (newInventory7) {await deleteFromDB(prisma, newInventory7, "inventory")};
    if (deletedInventory) {await deleteFromDB(prisma, deletedInventory, "inventory")};
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")};
    if (newBookstore2) {await deleteFromDB(prisma, newBookstore2, "bookstore")};
    if (newBookstore3) {await deleteFromDB(prisma, newBookstore3, "bookstore")};
    if (newBookstore4) {await deleteFromDB(prisma, newBookstore4, "bookstore")};
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (newImpression2) {await deleteFromDB(prisma, newImpression2, "impression")};
    if (newImpression3) {await deleteFromDB(prisma, newImpression3, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (newBook3) {await deleteFromDB(prisma, newBook3, "book")};
    if (newBook4) {await deleteFromDB(prisma, newBook4, "book")};
    if (newBook5) {await deleteFromDB(prisma, newBook5, "book")};
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
    mute.mockRestore();
  })

  it("should return a 500 status", async() => {
    await updateInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the inventory in the database", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}});
    expect(updatedInventory.bookId).toBe(newBook.id)
    expect(updatedInventory.bookstoreId).toBe(newBookstore.id)
    expect(updatedInventory.initial).toBe(3000)
    expect(updatedInventory.price).toBe(499.99)
  })
})



describe("updating a deleted inventory", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    newBook3 = await createBook(prisma, [newAuthor.id]);
    newBook4 = await createBook(prisma, [newAuthor.id]);
    newBook5 = await createBook(prisma, [newAuthor.id]);
    deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, {quantity: 1000});
    newImpression3 = await createImpression(prisma, newBook.id, {quantity: 1000});
    deletedImpression = await createImpression(prisma, newBook.id, {quantity: 100, isDeleted: true});
    newBookstore = await createBookstore(prisma);
    newBookstore2 = await createBookstore(prisma);
    newBookstore3 = await createBookstore(prisma);
    newBookstore4 = await createBookstore(prisma);
    deletedBookstore = await createBookstore(prisma, {isDeleted: true});
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000, isDeleted: true});
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 1000});
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, {initial: 3000, current: 3000, returns: 0, givenToAuthor: 0, isDeleted: true});
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, {initial: 3000, current: 3000, returns: 10, givenToAuthor: 10});
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: true, returns:0, givenToAuthor: 0});
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
    newSale3 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [newPayment.id], {quantity: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockReq = {
      params: {
        id: newInventory4.id
      }, 
      body: {
        book: newBook2.id,
        bookstore: newBookstore3.id,
        initial: 4000,
        price: 459.99
      },
      prisma: prisma
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    if (deletedSale) {await deleteFromDB(prisma, deletedSale, "sale")};
    if (newSale1) {await deleteFromDB(prisma, newSale1, "sale")};
    if (newSale2) {await deleteFromDB(prisma, newSale2, "sale")};
    if (newSale3) {await deleteFromDB(prisma, newSale3, "sale")};
    if (newSale4) {await deleteFromDB(prisma, newSale4, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")};
    if (newInventory3) {await deleteFromDB(prisma, newInventory3, "inventory")};
    if (newInventory4) {await deleteFromDB(prisma, newInventory4, "inventory")};
    if (newInventory5) {await deleteFromDB(prisma, newInventory5, "inventory")};
    if (newInventory6) {await deleteFromDB(prisma, newInventory6, "inventory")};
    if (newInventory7) {await deleteFromDB(prisma, newInventory7, "inventory")};
    if (deletedInventory) {await deleteFromDB(prisma, deletedInventory, "inventory")};
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")};
    if (newBookstore2) {await deleteFromDB(prisma, newBookstore2, "bookstore")};
    if (newBookstore3) {await deleteFromDB(prisma, newBookstore3, "bookstore")};
    if (newBookstore4) {await deleteFromDB(prisma, newBookstore4, "bookstore")};
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (newImpression2) {await deleteFromDB(prisma, newImpression2, "impression")};
    if (newImpression3) {await deleteFromDB(prisma, newImpression3, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (newBook3) {await deleteFromDB(prisma, newBook3, "book")};
    if (newBook4) {await deleteFromDB(prisma, newBook4, "book")};
    if (newBook5) {await deleteFromDB(prisma, newBook5, "book")};
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
    mute.mockRestore();
  })

  it("should return a 500 status", async() => {
    await updateInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the inventory in the database", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory4.id}});
    expect(updatedInventory.bookId).toBe(newBook.id)
    expect(updatedInventory.bookstoreId).toBe(newBookstore4.id)
    expect(updatedInventory.initial).toBe(3000)
    expect(updatedInventory.price).toBe(499.99)
  })
})