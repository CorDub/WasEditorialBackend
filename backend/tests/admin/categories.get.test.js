import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getCategories, getCategoryTypes } from "../../routes/adminRoutes.js";
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

let prisma;
let testDBName;
let deletedCategory, category1;
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
  deletedCategory = await createCategory(prisma, {isDeleted: true});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



//GETTING
describe("getting all valid categories", () => {
  let mockReq, mockRes, jsonResponse;

  beforeAll(async() => {
    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
  })

  it("should return a list of all valid categories", async() => {
    await getCategories(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted categories", async() => {
    expect(jsonResponse.includes(deletedCategory)).toBeFalsy()
  })
})



describe("getting all valid category types", () => {
  let mockReq, mockRes, jsonResponse;

  beforeAll(async() => {
    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it("should return a list of all valid category types", async() => {
    await getCategoryTypes(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should only return ids and types", async() => {
    expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "type"]);
  })

  it("should not contain deleted categories", async() => {
    expect(jsonResponse.includes(deletedCategory)).toBeFalsy()
  })
})