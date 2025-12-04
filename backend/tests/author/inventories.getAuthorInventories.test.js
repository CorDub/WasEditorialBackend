import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getAuthorInventories } from "../../routes/authorRoutes.js";
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
import * as mailer from "../../mailer.js"

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



describe(`getting author inventories with valid parameters`, () => {
  let mockReq, mockRes, jsonRes;
  let author;
  let book1, book2, book3;
  let was, bookstore1, bookstore2; 
  let inventory1, inventory2, inventory3, deletedInventory, wasInventory, wasInventoryDeleted; 
  let payment, olderPayment;
  let sale1, sale2, sale3;
  let impression1, impression2, impression3, impression4, deletedImpression;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    book3 = await createBook(prisma, [author.id])
    was = await createBookstore(prisma)
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current:180, isDeleted:false, returns: 0, givenToAuthor: 10})
    inventory2 = await createInventory(prisma, book2.id, bookstore1.id, {initial: 100, current:80, isDeleted:false, returns: 0, givenToAuthor: 10})
    inventory3 = await createInventory(prisma, book3.id, bookstore2.id, {initial: 100, current:80, isDeleted:false, returns: 0, givenToAuthor: 10})
    deletedInventory = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current:80, isDeleted:true, returns: 0, givenToAuthor: 10})
    wasInventory = await createInventory(prisma, book3.id, 1, {initial: 100, current:100, isDeleted:false, returns: 0, givenToAuthor: 10})
    wasInventoryDeleted = await createInventory(prisma, book1.id, 1, {initial: 100, current:80, isDeleted:true, returns: 0, givenToAuthor: 10})
    payment = await createPayment(prisma, author.id, "2025-11")
    olderPayment = await createPayment(prisma, author.id, "2025-10")
    sale1 = await createSale(prisma, inventory1.id, [payment.id], {quantity: 10})
    sale2 = await createSale(prisma, inventory2.id, [olderPayment.id], {quantity: 10})
    sale3 = await createSale(prisma, inventory3.id, [olderPayment.id], {quantity: 10, isDeleted: true})
    impression1 = await createImpression(prisma, book1.id, {quantity: 100})
    impression2 = await createImpression(prisma, book1.id, {quantity: 100})
    impression3 = await createImpression(prisma, book2.id, {quantity: 100})
    impression4 = await createImpression(prisma, book3.id, {quantity: 200})
    deletedImpression = await createImpression(prisma, book1.id, {quantity: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

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
  let mockReq, mockRes, jsonRes, mute;
  let author;
  let book1, book2, book3;
  let was, bookstore1, bookstore2; 
  let inventory1, inventory2, inventory3, deletedInventory, wasInventory, wasInventoryDeleted; 
  let payment, olderPayment;
  let sale1, sale2, sale3;
  let impression1, impression2, impression3, impression4, deletedImpression;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    book3 = await createBook(prisma, [author.id])
    was = await createBookstore(prisma)
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current:180, isDeleted:false, returns: 0, givenToAuthor: 10})
    inventory2 = await createInventory(prisma, book2.id, bookstore1.id, {initial: 100, current:80, isDeleted:false, returns: 0, givenToAuthor: 10})
    inventory3 = await createInventory(prisma, book3.id, bookstore2.id, {initial: 100, current:80, isDeleted:false, returns: 0, givenToAuthor: 10})
    deletedInventory = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current:80, isDeleted:true, returns: 0, givenToAuthor: 10})
    wasInventory = await createInventory(prisma, book3.id, 1, {initial: 100, current:100, isDeleted:false, returns: 0, givenToAuthor: 10})
    wasInventoryDeleted = await createInventory(prisma, book1.id, 1, {initial: 100, current:80, isDeleted:true, returns: 0, givenToAuthor: 10})
    payment = await createPayment(prisma, author.id, "2025-11")
    olderPayment = await createPayment(prisma, author.id, "2025-10")
    sale1 = await createSale(prisma, inventory1.id, [payment.id], {quantity: 10})
    sale2 = await createSale(prisma, inventory2.id, [olderPayment.id], {quantity: 10})
    sale3 = await createSale(prisma, inventory3.id, [olderPayment.id], {quantity: 10, isDeleted: true})
    impression1 = await createImpression(prisma, book1.id, {quantity: 100})
    impression2 = await createImpression(prisma, book1.id, {quantity: 100})
    impression3 = await createImpression(prisma, book2.id, {quantity: 100})
    impression4 = await createImpression(prisma, book3.id, {quantity: 200})
    deletedImpression = await createImpression(prisma, book1.id, {quantity: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: null
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return status 401`, async() => {
    await getAuthorInventories(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not return any data`, async() => {
    expect(mockRes.json.mock.calls[0][0]).toEqual({ message: "Unauthorized" });
  })
})
