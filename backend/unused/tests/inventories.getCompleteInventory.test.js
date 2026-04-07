import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getCompleteInventory } from "../../routes/authorRoutes.js";
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



describe(`get valid complete inventories`, async() => {
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
      prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it("should return a status 200", async() => {
    await getCompleteInventory(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('should return all complete inventories, excluding deleted', async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes.length).toBe(4)
  })

  it(`should return the correct data`, async() => {
    const inventory1 = jsonRes.find(inventory => inventory.book.id === book1.id)
    const inventory2 = jsonRes.find(inventory => inventory.book.id === book2.id)
    const inventory3 = jsonRes.find(inventory => inventory.book.id === book3.id && inventory.bookstore.id === bookstore2.id)
    const wasInventory = jsonRes.find(inventory => inventory.bookstore.id === 1)

    expect(inventory1.current).toBe(180)
    expect(inventory1.givenToAuthor).toBe(10)
    expect(inventory1.returns).toBe(0)
    expect(inventory1.sold).toBe(10)

    expect(inventory2.current).toBe(80)
    expect(inventory2.givenToAuthor).toBe(10)
    expect(inventory2.returns).toBe(0)
    expect(inventory2.sold).toBe(10)

    expect(inventory3.current).toBe(80)
    expect(inventory3.givenToAuthor).toBe(10)
    expect(inventory3.returns).toBe(0)
    expect(inventory3.sold).toBe(0)

    expect(wasInventory.current).toBe(100)
    expect(wasInventory.givenToAuthor).toBe(10)
    expect(wasInventory.returns).toBe(0)
    expect(wasInventory.sold).toBe(0)    
  })
})