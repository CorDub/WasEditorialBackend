import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import {
  getInventories,
  getInventoryNames,
  getInventoriesByBook,
  getBookInventory,
  getInventoriesByBookstore,
  getBookstoreInventory,
  getInventoriesCurrentTotals,
  updateInventory,
  deleteInventory
} from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import {
  getForMonth,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createImpression,
  deleteFromDB 
} from "../utils.js"

// GETTING
describe("getting all valid inventories", () => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let mockRes, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newImpression = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, true);
    newBookstore = await createBookstore(prisma, "newBookstore");
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 1000);
    console.log("newInventory", newInventory);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, true);
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
  })

  afterAll(async() => {
    if (deletedSale) {await deleteFromDB(prisma, deletedSale, "sale")};
    if (newSale1) {await deleteFromDB(prisma, newSale1, "sale")};
    if (newSale2) {await deleteFromDB(prisma, newSale2, "sale")};
    if (newSale3) {await deleteFromDB(prisma, newSale3, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (deletedInventory) {await deleteFromDB(prisma, deletedInventory, "inventory")};
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 200 status", async() => {
    await getInventories({}, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should return an array of valid inventories", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it("should not contain deleted inventories", async() => {
    expect(jsonResponse.includes(deletedInventory)).toBeFalsy()
  })

  it(`should return an object with id, bookId, book, bookstoreId, bookstore, country, price, 
  initial, current, returns, givenToAuthor, sales and totalSales, `, async() => {
    const expected = [
        "id",
        "bookId",
        "book",
        "bookstoreId",
        "bookstore",
        "country",
        "price",
        "initial",
        "current",
        "returns",
        "givenToAuthor",
        "sales",
        "totalSales"
      ]
    for (const element of jsonResponse) {
      try {
        expect(Object.keys(element)).toStrictEqual(expected)
      } catch (error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })
  
  it(`should return book title and bookstore name`, async() => {
    for (const element of jsonResponse) {
      try {
        expect(element.book.title).toBeTruthy();
        expect(element.bookstore.name).toBeTruthy();
      } catch(error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should return valid impressions tied to the book 
  with id, quantity, note and createdAt`, async() => {
    for (const element of jsonResponse) {
      try {
        expect(element.book.impressions.length).toBeGreaterThan(0);
        for (const impression of element.book.impressions) {
          try {
            expect(impression.id).toBeTruthy();
            expect(impression.quantity).toBeTruthy();
            expect(impression.createdAt).toBeTruthy();
          } catch(error) {
            throw error
          }
        }
      } catch(error) {
        console.log(`error at element ${element.id}, book: ${element.book.title}, 
          bookstore: ${element.bookstore.name}`, error);
        console.log("element.book.impressions", element.book.impressions);
        throw error;
      }
    }
  })

  it(`should not return deleted impressions tied to the book`, async() => {
    for (const element of jsonResponse) {
      try {
        expect(element.book.impressions.includes(deletedImpression)).toBeFalsy();
      } catch(error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should return valid sales tied to the book with quantity`, async() => {
    for (const element of jsonResponse) {
      try {
        expect(element.sales).toBeTruthy();
        for (const sale of element.sales) {
          try {
            expect(sale.quantity).toBeTruthy();
          } catch(error) {
            throw error;
          }
        }
      } catch(error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should not return deleted sales tied to the book with quantity`, async() => {
    for (const element of jsonResponse) {
      try {
        expect(element.sales.includes(deletedSale)).toBeFalsy();
      } catch(error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should return a totalSale equal to all sales quantity`, async() => {
    const newInventoryResult = jsonResponse.find(element => element.id === newInventory.id);
    expect(newInventoryResult.totalSales).toBe(200);
  })
})