import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getAuthorInventories,
  getAuthorBookInventories,
  getCompleteInventory,
} from "../../routes/authorRoutes.js";
import { prisma } from "../../prisma/client.js";
import {
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  deleteFromDB, 
  createCategory,
  createImpression
} from "../../testUtils.js";


describe(`getting author inventories with valid parameters`, () => {
  let mockReq, mockRes, jsonRes;
  let author;
  let book1, book2, book3;
  let bookstore1, bookstore2; 
  let inventory1, inventory2, inventory3, deletedInventory, wasInventory, wasInventoryDeleted; 
  let payment, olderPayment;
  let sale1, sale2, sale3;
  let impression1, impression2, impression3, impression4, deletedImpression;

  beforeAll(async() => {
    author = await createAuthor(prisma, "Yoelo", "Hironame", "yoelo.hironame@gmail.com", "author")
    book1 = await createBook(prisma, "book1", [{"id": author.id}])
    book2 = await createBook(prisma, "book2", [{"id": author.id}])
    book3 = await createBook(prisma, "book3", [{"id": author.id}])
    bookstore1 = await createBookstore(prisma, "bookstore1")
    bookstore2 = await createBookstore(prisma, "bookstore2")
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, 100, 180, false, 0, 10)
    inventory2 = await createInventory(prisma, book2.id, bookstore1.id, 100, 80, false, 0, 10)
    inventory3 = await createInventory(prisma, book3.id, bookstore2.id, 100, 80, false, 0, 10)
    deletedInventory = await createInventory(prisma, book2.id, bookstore2.id, 100, 80, true, 0, 10)
    wasInventory = await createInventory(prisma, book3.id, 1, 100, 100, false, 0, 10)
    wasInventoryDeleted = await createInventory(prisma, book1.id, 1, 100, 80, true, 0, 10)
    payment = await createPayment(prisma, author.id, "2025-11")
    olderPayment = await createPayment(prisma, author.id, "2025-10")
    sale1 = await createSale(prisma, inventory1.id, [{"id": payment.id}], 10)
    sale2 = await createSale(prisma, inventory2.id, [{"id": olderPayment.id}], 10)
    sale3 = await createSale(prisma, inventory3.id, [{"id": olderPayment.id}], 10, {isDeleted: true})
    impression1 = await createImpression(prisma, book1.id, 100)
    impression2 = await createImpression(prisma, book1.id, 100)
    impression3 = await createImpression(prisma, book2.id, 100)
    impression4 = await createImpression(prisma, book3.id, 200)
    deletedImpression = await createImpression(prisma, book1.id, 100, {isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, deletedImpression, "impression")
    await deleteFromDB(prisma, impression1, "impression")
    await deleteFromDB(prisma, impression2, "impression")
    await deleteFromDB(prisma, impression3, "impression")
    await deleteFromDB(prisma, impression4, "impression")
    await deleteFromDB(prisma, sale1, "sale")
    await deleteFromDB(prisma, sale2, "sale")
    await deleteFromDB(prisma, sale3, "sale")
    await deleteFromDB(prisma, payment, 'payment')
    await deleteFromDB(prisma, olderPayment, 'payment')
    await deleteFromDB(prisma, inventory1, "inventory")
    await deleteFromDB(prisma, inventory2, "inventory")
    await deleteFromDB(prisma, inventory3, "inventory")
    await deleteFromDB(prisma, deletedInventory, "inventory")
    await deleteFromDB(prisma, wasInventory, "inventory")
    await deleteFromDB(prisma, wasInventoryDeleted, "inventory")
    await deleteFromDB(prisma, bookstore1, "bookstore")
    await deleteFromDB(prisma, bookstore2, "bookstore")
    await deleteFromDB(prisma, book1, "book")
    await deleteFromDB(prisma, book2, "book")
    await deleteFromDB(prisma, book3, "book")
    await deleteFromDB(prisma, author, "author");
  })

  it("should return a status 200", async() => {
    await getAuthorInventories(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return an object containing a general summary and summary by book inventories`, () => {
    jsonRes = mockRes.json.mock.calls[0][0]
    const expectedKeys = ["summary", "bookInventories"]
    expect(Object.keys(jsonRes)).toStrictEqual(expectedKeys)
  })

  it(`should correctly sum up initial inventories, not taking deleted into account`, async() => {
    expect(jsonRes.summary.initial).toBe(400);
  })

  it(`should correctly sum up new impressions, not taking deleted into account`, async() => {
    expect(jsonRes.summary.impressions).toBe(100);
  })

  it(`should correctly sum up sold copies, not taking deleted into account`, async() => {
    expect(jsonRes.summary.sold).toBe(20);
  })

  it(`should correctly sum up available copies, not taking deleted into account`, async() => {
    expect(jsonRes.summary.total).toBe(440);
  })

  it(`should correctly sum up copies in bookstores other than Bodega Was, not taking deleted into account`,
    async() => {
      expect(jsonRes.summary.bookstores).toBe(340);
  })

  it(`should correctly sum up copies in BodegaWas, not taking deleted into account`, async() => {
    expect(jsonRes.summary.was).toBe(100);
  })

  it(`should correctly sum up copies given to the author, not taking deleted into account`, async() => {
    expect(jsonRes.summary.givenToAuthor).toBe(40);
  })

  it(`initial + impressions - sold - givenToAuthor should equal total`, async() => {
    expect(jsonRes.summary.total).toBe(
      jsonRes.summary.initial + 
      jsonRes.summary.impressions -
      jsonRes.summary.givenToAuthor -
      jsonRes.summary.sold
    )
  })

  it(`was + bookstores should equal total`, async() => {
    expect(jsonRes.summary.total).toBe(jsonRes.summary.was + jsonRes.summary.bookstores)
  })
})


describe(`getting author inventories without being logged in`, () => {
  let mockReq, mockRes, jsonRes;
  let author;
  let book1, book2, book3;
  let bookstore1, bookstore2; 
  let inventory1, inventory2, inventory3, deletedInventory, wasInventory, wasInventoryDeleted; 
  let payment, olderPayment;
  let sale1, sale2, sale3;
  let impression1, impression2, impression3, impression4, deletedImpression;

  beforeAll(async() => {
    author = await createAuthor(prisma, "Yoelo", "Hironame", "yoelo.hironame@gmail.com", "author")
    book1 = await createBook(prisma, "book1", [{"id": author.id}])
    book2 = await createBook(prisma, "book2", [{"id": author.id}])
    book3 = await createBook(prisma, "book3", [{"id": author.id}])
    bookstore1 = await createBookstore(prisma, "bookstore1")
    bookstore2 = await createBookstore(prisma, "bookstore2")
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, 100, 180, false, 0, 10)
    inventory2 = await createInventory(prisma, book2.id, bookstore1.id, 100, 80, false, 0, 10)
    inventory3 = await createInventory(prisma, book3.id, bookstore2.id, 100, 80, false, 0, 10)
    deletedInventory = await createInventory(prisma, book2.id, bookstore2.id, 100, 80, true, 0, 10)
    wasInventory = await createInventory(prisma, book3.id, 1, 100, 100, false, 0, 10)
    wasInventoryDeleted = await createInventory(prisma, book1.id, 1, 100, 80, true, 0, 10)
    payment = await createPayment(prisma, author.id, "2025-11")
    olderPayment = await createPayment(prisma, author.id, "2025-10")
    sale1 = await createSale(prisma, inventory1.id, [{"id": payment.id}], 10)
    sale2 = await createSale(prisma, inventory2.id, [{"id": olderPayment.id}], 10)
    sale3 = await createSale(prisma, inventory3.id, [{"id": olderPayment.id}], 10, {isDeleted: true})
    impression1 = await createImpression(prisma, book1.id, 100)
    impression2 = await createImpression(prisma, book1.id, 100)
    impression3 = await createImpression(prisma, book2.id, 100)
    impression4 = await createImpression(prisma, book3.id, 200)
    deletedImpression = await createImpression(prisma, book1.id, 100, {isDeleted: true})

    mockReq = {
      session: {
        user_id: null
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, deletedImpression, "impression")
    await deleteFromDB(prisma, impression1, "impression")
    await deleteFromDB(prisma, impression2, "impression")
    await deleteFromDB(prisma, impression3, "impression")
    await deleteFromDB(prisma, impression4, "impression")
    await deleteFromDB(prisma, sale1, "sale")
    await deleteFromDB(prisma, sale2, "sale")
    await deleteFromDB(prisma, sale3, "sale")
    await deleteFromDB(prisma, payment, 'payment')
    await deleteFromDB(prisma, olderPayment, 'payment')
    await deleteFromDB(prisma, inventory1, "inventory")
    await deleteFromDB(prisma, inventory2, "inventory")
    await deleteFromDB(prisma, inventory3, "inventory")
    await deleteFromDB(prisma, deletedInventory, "inventory")
    await deleteFromDB(prisma, wasInventory, "inventory")
    await deleteFromDB(prisma, wasInventoryDeleted, "inventory")
    await deleteFromDB(prisma, bookstore1, "bookstore")
    await deleteFromDB(prisma, bookstore2, "bookstore")
    await deleteFromDB(prisma, book1, "book")
    await deleteFromDB(prisma, book2, "book")
    await deleteFromDB(prisma, book3, "book")
    await deleteFromDB(prisma, author, "author");
  })

  it(`should return status 401`, async() => {
    await getAuthorInventories(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not return any data`, async() => {
    expect(mockRes.json.mock.calls[0][0]).toEqual({ message: "Unauthorized" });
  })
})


describe(`get all valid inventories of a specific book of an author 
grouped by bookstores`, async() => {
  let mockReq, mockRes, jsonRes;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2, inventory3, inventory4, wasInventory1, wasInventory2;
  let impression1, impression2, impression3, impression4;

  beforeAll(async() => {
    author = await createAuthor(prisma, "Geroan", "Idfenopte", 'geroan.idfenopte@gmail.com', "author")
    book1 = await createBook(prisma, "book1", [{"id": author.id}])
    book2 = await createBook(prisma, "book2", [{"id": author.id}])
    bookstore1 = await createBookstore(prisma, "bookstore1")
    bookstore2 = await createBookstore(prisma, "bookstore2")
    wasInventory1 = await createInventory(prisma, book1.id, 1, 400, 280, false, 30, 0)
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, 100, 70, false, 20, 10)
    inventory2 = await createInventory(prisma, book1.id, bookstore2.id, 100, 50, false, 10, 40)
    wasInventory2 = await createInventory(prisma, book2.id, 1, 100, 100, false, 10, 0)
    inventory3 = await createInventory(prisma, book2.id, bookstore1.id, 100, 80, false, 10, 10)
    inventory4 = await createInventory(prisma, book2.id, bookstore2.id, 100, 80, true, 10, 10)
    impression1 = await createImpression(prisma, book1.id, 200)
    impression2 = await createImpression(prisma, book1.id, 200)
    impression3 = await createImpression(prisma, book2.id, 200, {isDeleted: false})
    impression4 = await createImpression(prisma, book2.id, 200, {isDeleted: true})

    mockReq = {
      params: {
        id: book1.id    
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, inventory1, "inventory")
    await deleteFromDB(prisma, inventory2, "inventory")
    await deleteFromDB(prisma, inventory3, "inventory")
    await deleteFromDB(prisma, inventory4, "inventory")
    await deleteFromDB(prisma, bookstore1, "bookstore")
    await deleteFromDB(prisma, bookstore2, "bookstore")
    await deleteFromDB(prisma, book1, "book")
    await deleteFromDB(prisma, book2, "book")
    await deleteFromDB(prisma, author, "author")
  })

  it(`should return a status 200`, async() => {
    await getAuthorBookInventories(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return the bookstoreId, name, title, initial, 
  current, returns and givenToAuthor total values for each bookstore,
  not taking deleted into account`, async() => {
    jsonRes = mockRes.status.mock.calls[0][0]
    expect(jsonRes.length).toBe(3)

    expect(jsonRes[0].bookstoreId).toBe(1)
    expect(jsonRes[0].name).toBe("Plataforma Was")
    expect(jsonRes[0].initial).toBe(500)
    expect(jsonRes[0].current).toBe(150)
    expect(jsonRes[0].returns).toBe(30)
    expect(jsonRes[0].given).toBe(20)

    expect(jsonRes[1].bookstoreId).toBe(bookstore1.id)
    expect(jsonRes[1].name).toBe("bookstore1")
    expect(jsonRes[1].initial).toBe(200)
    expect(jsonRes[1].current).toBe(150)
    expect(jsonRes[1].returns).toBe(30)
    expect(jsonRes[1].given).toBe(20)

    expect(jsonRes[2].bookstoreId).toBe(bookstore2.id)
    expect(jsonRes[2].name).toBe("bookstore2")
    expect(jsonRes[2].initial).toBe(200)
    expect(jsonRes[2].current).toBe(50)
    expect(jsonRes[2].returns).toBe(10)
    expect(jsonRes[2].given).toBe(40)
  })
})