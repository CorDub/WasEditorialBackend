import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getBookstores, getExistingBookstoreNames} from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createTestDB,
  dropTestDB,
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

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

// GETTING
describe("getting all valid bookstores", async() => {
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

  it("should return a list of all valid bookstores", async() => {
    await getBookstores(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted bookstores", async() => {
    expect(jsonResponse.includes(deletedBookstore)).toBeFalsy()
  })
})


describe("getting all existing bookstore names", () => {
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

  it("should return a list of all valid bookstore names", async() => {
    await getExistingBookstoreNames(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should only send out id, title and bookId", async() => {
    expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "name", "inventories"]);
  })

  it("should not contain deleted bookstores", async() => {
    expect(jsonResponse.includes(deletedBookstore)).toBeFalsy()
  })
})