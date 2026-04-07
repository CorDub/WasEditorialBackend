import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteCategory } from "../../../routes/admin/categories/deleteCategory.js";
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
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let deletedCategory, category1;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  deletedCategory = await createCategory(prisma, {number: 2, isDeleted: true});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



// DELETING
describe('deleting a category with valid parameters', () => {
  let newCategory;
  let otherCategory;
  let newAuthor;
  let newDeletedAuthor;
  let newBook;
  let newDeletedBook;
  let mockReq;
  let mockRes;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 3})
    otherCategory = await createCategory(prisma, {number: 4})
    newAuthor = await createAuthor(prisma)
    newBook = await createBook(prisma, [newAuthor.id], {categoryId: newCategory.id})
    newDeletedBook = await createBook(prisma, [newAuthor.id], {categoryId: newCategory.id, isDeleted: true})
    // newDeletedAuthor = await createAuthor(prisma, {isDeleted: true, categoryId: newCategory.id})

    mockReq = {
      params: {
        id: newCategory.id
      },
      body: {
        selectedCategory: otherCategory.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it("should send a 200 status", async() => {
    await deleteCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the category as deleted in the database", async() => {
    const deletedCategory = await prisma.category.findUnique({where: {id: newCategory.id}})
    expect(deletedCategory.isDeleted).toBe(true);
  }) 

  it("should move books from the deleted category to the selected one", async() => {
    const movedBook = await prisma.book.findUnique({where: {id: newBook.id}});
    expect(movedBook.categoryId).toBe(otherCategory.id)
  })

  it("should move deleted books from the deleted category to the selected one", async() => {
    const movedDeletedBook = await prisma.book.findUnique({where: {id: newDeletedBook.id}});
    expect(movedDeletedBook.categoryId).toBe(otherCategory.id)
  })

  ////TO DO - test impact of changing categories on payment values
})