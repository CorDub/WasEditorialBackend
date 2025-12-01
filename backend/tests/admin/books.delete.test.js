import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteBook } from "../../routes/adminRoutes.js";
import { getForMonth } from "../../utils.js";
import {
  createAuthor,
  createBook,
  createTestDB,
  dropTestDB,
  createCategory,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;
let author1, author2;
let wasBookstore;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  author1 = await createAuthor(prisma);
  author2 = await createAuthor(prisma);
  wasBookstore = await createBookstore(prisma, {name: "Plataforma Was"});
})

afterAll(async() => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


///DELETING
describe("deleting a book with valid parameters", async() => {
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let newImpression, newPayment, newSale, newKindleSale, newCost;
  let deletedBook, deletedInventory1, deletedInventory2, deletedSale, deletedKindleSale, deletedCost;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 2000});
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    newSale = await createSale(prisma, inventory1.id, [newPayment.id], {quantity: 100});
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id], {quantityEbook: 50, quantityPod: 50, regalias: 100});
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 100});

    mockReq = {
      params: {
        "id": newBook.id
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should return a status 200", async() => {
    await deleteBook(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the book as deleted in the database", async() => {
    deletedBook = await prisma.book.findUnique({where: {id: newBook.id}});
    expect(deletedBook.isDeleted).toBe(true)
  })

  it("should mark all tied inventories as deleted on cascade", async() => {
    deletedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(deletedInventory1.isDeleted).toBe(true);
    deletedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(deletedInventory2.isDeleted).toBe(true);
  })

  it("should mark all tied sales as deleted", async() => {
    deletedSale = await prisma.sale.findUnique({where: {id: newSale.id}});
    expect(deletedSale.isDeleted).toBe(true)
  })

  it("should mark all tied kindleSales as deleted", async() => {
    deletedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(deletedKindleSale.isDeleted).toBe(true)
  })

  it("should mark all tied Costs as deleted", async() => {
    deletedCost = await prisma.cost.findUnique({where: {id: newCost.id}});
    expect(deletedCost.isDeleted).toBe(true)
  })
})