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
} from "../../routes/adminRoutes.js";
import { prisma } from "../../prisma/client.js";
import { getForMonth } from "../../utils.js"
import {
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
} from "../../testUtils.js";

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
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 1000);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});

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


describe("getting all valid inventory names", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore;
  let mockRes, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 1000);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});

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
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 200 status", async() => {
    await getInventoryNames({}, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should return an array of valid inventory names", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it("should not contain names of deleted bookstores and books", async() => {
    const deletedBookName = {name: deletedBook.title, type: "book", id: deletedBook.id}
    const deletedBookstoreName = {name: deletedBookstore.name, type: "bookstore", id: deletedBookstore.id}
    expect(jsonResponse.includes(deletedBookName)).toBeFalsy()
    expect(jsonResponse.includes(deletedBookstoreName)).toBeFalsy() 
  })

  it(`should return an object with keys name, type and id`, async() => {
    const expected = [
        "name",
        "type",
        "id"
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

  it(`should correctly return the actual name, type and id`, async() => {
    const bookName = jsonResponse.find(element => element.id === newBook.id && element.type === "book");
    const bookstoreName = jsonResponse.find(element => element.id === newBookstore.id && element.type === "bookstore");
    expect(bookName.name).toBe("newBook");
    expect(bookName.type).toBe("book");
    expect(bookName.id).toBe(newBook.id);
    expect(bookstoreName.name).toBe("newBookstore");
    expect(bookstoreName.type).toBe("bookstore");
    expect(bookstoreName.id).toBe(newBookstore.id);
  })
})


describe("getting all valid inventories by book", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3;
  let mockRes, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000);
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});

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
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")};
    if (newImpression) {await deleteFromDB(prisma, newImpression, "impression")};
    if (newImpression2) {await deleteFromDB(prisma, newImpression2, "impression")};
    if (newImpression3) {await deleteFromDB(prisma, newImpression3, "impression")};
    if (deletedImpression) {await deleteFromDB(prisma, deletedImpression, "impression")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")};
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 200 status", async() => {
    await getInventoriesByBook({}, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should return an array of valid inventories objects", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it("should not contain deleted inventories objects", async() => {
    const deletedInventoryObject = jsonResponse.find(element => element.id === deletedInventory.id)
    expect(deletedInventoryObject).toBeFalsy() 
  })

  it(`should return an object with keys id, type, name, initial, sold,
    current, returns, givenToAuthor and extraImpressions(optional)`, async() => {
    const expected1 = ["id","type","name","initial","sold","current","returns","givenToAuthor"]
    const expected2 = [...expected1, "extraImpressions"]
    for (const element of jsonResponse) {
      try {
        expect([expected1, expected2]).toContainEqual(Object.keys(element));
      } catch (error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should correctly return the values for each key`, async() => {
    const inventoryByBookObject = jsonResponse.find(element => element.id === newInventory.bookId);
    expect(inventoryByBookObject.id).toBe(newBook.id);
    expect(inventoryByBookObject.type).toBe("book");
    expect(inventoryByBookObject.name).toBe("newBook");
    expect(inventoryByBookObject.initial).toBe(3000);
    expect(inventoryByBookObject.current).toBe(3000);
    expect(inventoryByBookObject.returns).toBe(0);
    expect(inventoryByBookObject.givenToAuthor).toBe(0);
  });

  it(`should correctly return extra impressions, not including deleted ones`, async() => {
    const inventoryByBookObject = jsonResponse.find(element => element.id === newInventory.bookId);
    expect(inventoryByBookObject.extraImpressions).toBe(2000);
  })
})

describe("getting a specific book inventory with valid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, originalInventory;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    originalInventory = await createInventory(prisma, newBook.id, 1, 1000, 1000, false, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

    mockReq = {
      params: {
        id: newBook.id
      }
    }

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
    if (newSale4) {await deleteFromDB(prisma, newSale4, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")};
    if (newInventory3) {await deleteFromDB(prisma, newInventory3, "inventory")};
    if (newInventory4) {await deleteFromDB(prisma, newInventory4, "inventory")};
    if (originalInventory) {await deleteFromDB(prisma, originalInventory, "inventory")};
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
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 200 status", async() => {
    await getBookInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a valid payload object with keys sortedRelevantInventories,
    name, id, currentTotal, initialTotal, returnsTotal, givenToAuthorTotal, 
    soldTotal and thatBookImpressions`, async() => {
      const expected = ['sortedRelevantInventories', 'name', 'id', 'currentTotal', 'initialTotal',
        'returnsTotal', 'givenToAuthorTotal', 'soldTotal', 'thatBookImpressions']
      expect(Object.keys(jsonResponse)).toStrictEqual(expected);
  })

  it("should not contain deleted inventories objects", async() => {
    const deletedInventoryObject = jsonResponse.sortedRelevantInventories.find(element => element.id === deletedInventory.id)
    expect(deletedInventoryObject).toBeFalsy() 
  })

  it(`should correctly return relevant inventories details`, async() => {
    const sortedRelevantInventories = jsonResponse.sortedRelevantInventories;
    for (const inventory of sortedRelevantInventories) {
      try {
        expect(inventory.bookId).toBe(newBook.id);
      } catch(error) {
        console.log("error with the following element", inventory);
        throw error
      }
    }
  });

  it(`sortedRelevantInventories should not contain deleted inventories`, async() => {
    const deletedSortedRelevantInventory = jsonResponse.sortedRelevantInventories.find(element => element.id === deletedInventory.id)
    expect(deletedSortedRelevantInventory).toBeFalsy();
  })
  
  it(`sortedRelevantInventories should return total sales, not counting deleted`, async() => {
    const relevantInventory = jsonResponse.sortedRelevantInventories.find(element => element.id === newInventory.id);
    expect(Object.keys(relevantInventory)).toContain("totalSales");
    expect(relevantInventory.totalSales).toBe(200);
  })

  it(`sortedRelevantInventories should be sorted by current value`, async() => {
    const first = jsonResponse.sortedRelevantInventories[0];
    const second = jsonResponse.sortedRelevantInventories[1];
    expect(first.current).toBeGreaterThanOrEqual(second.current);
  });

  it(`should correctly return the totals of all relevant inventories`, async() => {
    expect(jsonResponse.currentTotal).toBe(10000);
    expect(jsonResponse.initialTotal).toBe(1000);
    expect(jsonResponse.returnsTotal).toBe(20);
    expect(jsonResponse.givenToAuthorTotal).toBe(20);
    expect(jsonResponse.soldTotal).toBe(300);
  })

  // it(`should correctly give you the inTienda number`, async() => {
  //   const relevantInventory = jsonResponse.sortedRelevantInventories.find(element => element.id === newInventory.id);
  //   expect(Object.keys(relevantInventory)).toContain("inTienda");
  //   expect(inTienda).toBe()
  // })

  it(`should correctly return an array of impressions object`, async() => {
    expect(Array.isArray(jsonResponse.thatBookImpressions)).toBeTruthy();
  })

  it(`should not contain deleted impressions`, async() => {
    const impression = jsonResponse.thatBookImpressions.find(element => element.id === deletedImpression.id)
    expect(impression).toBeFalsy();
  })

  it(`the impression data should return id, quantity, note, isDeleted, 
    createdAt and date`, async() => {
    const expected = ['id','quantity','note','isDeleted','createdAt','date'];
    const impressions = jsonResponse.thatBookImpressions;
    for (const impression of impressions) {
      try {
        expect(Object.keys(impression)).toEqual(expected);
      } catch(error) {
        console.log("error with the following impression");
        console.log(impression);
        throw error
      }
    }
  })
  
  it(`the impression data should be correct`, async() => {
    expect(jsonResponse.thatBookImpressions.length).toBe(3);
    const firstImpressionData = jsonResponse.thatBookImpressions.find(element => element.id === newImpression.id)
    expect(firstImpressionData.quantity).toBe(1000);
    expect(firstImpressionData.note).toBe("this is the note");
    expect(firstImpressionData.date).toStrictEqual(new Date('2025-10-29'));
  })
})


describe("getting a specific inventory with invalid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

    mockReq = {
      params: {
        id: "yeah this ain't really a book id"
      }
    }

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
    if (newSale4) {await deleteFromDB(prisma, newSale4, "sale")};
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")};
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")};
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")};
    if (newInventory3) {await deleteFromDB(prisma, newInventory3, "inventory")};
    if (newInventory4) {await deleteFromDB(prisma, newInventory4, "inventory")};
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
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a 500 status", async() => {
    await getBookInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })
})


describe("getting all valid inventories by bookstore", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

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
    await getInventoriesByBookstore({}, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should return an array of valid inventories objects", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it("should not contain deleted inventories objects", async() => {
    const deletedInventoryObject = jsonResponse.find(element => element.id === deletedInventory.id)
    expect(deletedInventoryObject).toBeFalsy() 
  })

  it(`should return an object with keys id, type, name, initial, sold,
    current, returns, givenToAuthor`, async() => {
    const expected1 = ["id","type","name","initial","sold","current","returns","givenToAuthor"]
    for (const element of jsonResponse) {
      try {
        expect(expected1).toEqual(Object.keys(element));
      } catch (error) {
        console.log(`error at element ${element}`, error);
        throw error;
      }
    }
  })

  it(`should correctly return the values for each key`, async() => {
    const inventoryByBookstoreObject = jsonResponse.find(element => element.id === newInventory.bookstoreId);
    expect(inventoryByBookstoreObject.id).toBe(newBookstore.id);
    expect(inventoryByBookstoreObject.type).toBe("bookstore");
    expect(inventoryByBookstoreObject.name).toBe("newBookstore");
    expect(inventoryByBookstoreObject.initial).toBe(9000);
    expect(inventoryByBookstoreObject.current).toBe(9000);
    expect(inventoryByBookstoreObject.returns).toBe(20);
    expect(inventoryByBookstoreObject.givenToAuthor).toBe(20);
  });
})


describe("getting a specific bookstore inventory with valid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockReq = {
      params: {
        id: newBookstore.id
      }
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
    await getBookstoreInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a valid payload object with keys sortedRelevantInventories,
    name, id, currentTotal, initialTotal, returnsTotal, givenToAuthorTotal, 
    soldTotal and thatBookImpressions`, async() => {
      const expected = ['sortedRelevantInventories', 'name', 'id', 'currentTotal', 'initialTotal',
        'returnsTotal', 'givenToAuthorTotal', 'soldTotal', 'extraImpressionsTotal']
      expect(Object.keys(jsonResponse).sort()).toEqual(expected.sort());
  })

  it(`should correctly return relevant inventories details`, async() => {
    const sortedRelevantInventories = jsonResponse.sortedRelevantInventories;
    for (const inventory of sortedRelevantInventories) {
      try {
        expect(inventory.bookstoreId).toBe(newBookstore.id);
      } catch(error) {
        console.log("error with the following element", inventory);
        throw error
      }
    }
  });

  it(`sortedRelevantInventories should not contain deleted inventories`, async() => {
    const deletedSortedRelevantInventory = jsonResponse.sortedRelevantInventories.find(element => element.id === deletedInventory.id)
    expect(deletedSortedRelevantInventory).toBeFalsy();
  })
  
  it(`sortedRelevantInventories should return total sales per inventory, not counting deleted`, async() => {
    const relevantInventory = jsonResponse.sortedRelevantInventories.find(element => element.id === newInventory.id);
    expect(Object.keys(relevantInventory)).toContain("totalSales");
    expect(relevantInventory.totalSales).toBe(200);
  })

  it(`sortedRelevantInventories should be sorted by current value`, async() => {
    const first = jsonResponse.sortedRelevantInventories[0];
    const second = jsonResponse.sortedRelevantInventories[1];
    expect(first.current).toBeGreaterThanOrEqual(second.current);
  });

  it(`should correctly return the totals of all relevant inventories`, async() => {
    expect(jsonResponse.currentTotal).toBe(9000);
    expect(jsonResponse.initialTotal).toBe(9000);
    expect(jsonResponse.returnsTotal).toBe(20);
    expect(jsonResponse.givenToAuthorTotal).toBe(20);
    expect(jsonResponse.soldTotal).toBe(200);
    expect(jsonResponse.extraImpressionsTotal).toBe(0)
  })

  // it(`should correctly return extra impressions if the inventory is Plataforma Was`, async() => {
  //   const mockReq2 = {params: {id: 1}}
  //   const mockRes2 = {json: vi.fn(), status: vi.fn().mockReturnThis()}
  //   await getBookstoreInventory(mockReq2, mockRes2)
  //   const jsonResponse2 = mockRes2.json.mock.calls[0][0]
  //   expect(jsonResponse2.name).toBe("Plataforma Was");
  //   expect(jsonResponse2.extraImpressionsTotal).toBe(3000);
  // })
})

describe('getting a specific bookstore with invalid parameters', async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockReq = {
      params: {
        id: "yeah this ain't a bookstore id"
      }
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

  it("should return a 500 status", async() => {
    await getBookstoreInventory(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })
})

describe("getting all valid inventories current totals", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

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
    await getInventoriesCurrentTotals(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should return an array of valid inventories objects", async() => {
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it(`should return a valid list of objects with keys _sum, bookstoreName`, async() => {
      const expected = ['_sum', 'bookstoreId', 'bookstoreName']
      expect(Object.keys(jsonResponse[0]).sort()).toEqual(expected.sort());
  })

  it(`should correctly return current totals for all inventories of a specific bookstore
    and not take deleted inventories into account`, async() => {
    const newBookstoreCurrentTotals = jsonResponse.find(element => element.bookstoreId === newBookstore.id);
    expect(newBookstoreCurrentTotals._sum.current).toBe(9000);
  });
})


describe("updating an inventory with valid parameters", async() => {
  let newAuthor, newBook, newImpression, deletedImpression, newBookstore, deletedInventory;
  let newInventory, deletedSale, newSale1, newSale2, newSale3, newBook2, newPayment;
  let deletedBook, deletedBookstore, newImpression2, newImpression3, newInventory2;
  let newInventory3, newInventory4, newBookstore2, newBookstore3, newBookstore4;
  let newSale4, newBook3, newBook4, newBook5, newInventory5, newInventory6, newInventory7;
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

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
        initial: 1200,
        price: 459.99
      }
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
        initial: 4000,
        price: 459.99
      }
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
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

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
      }
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
  let mockRes, mockReq, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "G", "B", 'g.b@gmail.com', "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBook2 = await createBook(prisma, "newBook2", [{'id': newAuthor.id}]);
    newBook3 = await createBook(prisma, "newBook3", [{'id': newAuthor.id}]);
    newBook4 = await createBook(prisma, "newBook4", [{'id': newAuthor.id}]);
    newBook5 = await createBook(prisma, "newBook5", [{'id': newAuthor.id}]);
    deletedBook = await createBook(prisma, "deleted book", [{"id": newAuthor.id}], true);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is the note", date: new Date("2025-10-29")});
    newImpression2 = await createImpression(prisma, newBook.id, 1000);
    newImpression3 = await createImpression(prisma, newBook.id, 1000);
    deletedImpression = await createImpression(prisma, newBook.id, 100, {isDeleted: true});
    newBookstore = await createBookstore(prisma, "newBookstore");
    newBookstore2 = await createBookstore(prisma, "newBookstore2");
    newBookstore3 = await createBookstore(prisma, "newBookstore3");
    newBookstore4 = await createBookstore(prisma, "newBookstore4");
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);
    deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000, true);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 3000, 3000, false, 0, 0);
    newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, 3000, 3000, false, 10, 10);
    newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, 3000, 3000, false, 10, 10);
    newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, 3000, 3000, true, 0, 0);
    newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, 3000, 3000, false, 10, 10);
    newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, 3000, 3000, true, 0, 0);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));

    deletedSale = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale1 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale2 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100);
    newSale3 = await createSale(prisma, newInventory.id, [{'id': newPayment.id}], 100, {isDeleted: true});
    newSale4 = await createSale(prisma, newInventory2.id, [{'id': newPayment.id}], 100);

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
      }
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