import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getImpactedBooks } from "../../../routes/admin/categories/getImpactedBooks.js";
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
  truncateAll
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe(`getImpactedBooks happy path`, async() => {
  let category;
  let author;
  let book, book2, deletedBook;
  let mockReq, mockRes, jsonResponse;

  beforeAll(async() => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id], {categoryId: category.id});
    book2 = await createBook(prisma, [author.id], {categoryId: category.id});
    deletedBook = await createBook(prisma, [author.id], {isDeleted: true, categoryId: category.id})

    mockReq = {
      params: {
        id: category.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a status 200`, async() => {
    await getImpactedBooks(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return the correct number`, async() => {
    expect(jsonResponse).toStrictEqual({numImpactedUsers: 2})
  })
})
