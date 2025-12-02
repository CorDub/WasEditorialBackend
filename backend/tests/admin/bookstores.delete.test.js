import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteBookstore } from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createTestDB,
  dropTestDB,
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import { getForMonth } from "../../utils.js";

let prisma;
let testDBName;
let category1;
let newAuthor;
let deletedBook, book1, book2;
let deletedBookstore, bookstore1, bookstore2;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  newAuthor = await createAuthor(prisma);
  book1 = await createBook(prisma, [newAuthor.id])
  book2 = await createBook(prisma, [newAuthor.id])
  deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
  bookstore1 = await createBookstore(prisma)
  bookstore2 = await createBookstore(prisma)
  deletedBookstore = await createBookstore(prisma, {isDeleted: true});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



////  DELETING
describe("deleting a bookstore with valid parameters", async() => {
  let newAuthor, newBook, newBook2, newBookstore;
  let newInventory, newInventory2, newPayment, newSale, newSale2;
  let deletedBookstore, deletedInventories, deletedSales;
  let mockReq, mockRes;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    newBookstore = await createBookstore(prisma);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 1000});
    newInventory2 = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000});
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    newSale = await createSale(prisma, newInventory.id, [newPayment.id]);
    newSale2 = await createSale(prisma, newInventory2.id, [newPayment.id])

    mockReq = {
      params: {
        "id": newBookstore.id
      }, 
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it("should return a status 200", async() => {
    await deleteBookstore(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the bookstore as deleted", async() => {
    deletedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}});
    expect(deletedBookstore.isDeleted).toBe(true)
  });

  it("should mark all tied inventories as deleted", async() => {
    deletedInventories = await prisma.inventory.findMany({where: {bookstoreId: newBookstore.id}});
    for (const inventory of deletedInventories) {
      expect(inventory.isDeleted).toBe(true);
    }
  })

  it("should mark all sales tied to these inventories as deleted", async() => {
    deletedSales = await prisma.sale.findMany({where: {inventoryId: {in: [newInventory.id, newInventory2.id]}}})
    for (const sale of deletedSales) {
      expect(sale.isDeleted).toBe(true);
    }
  })
})