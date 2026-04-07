import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getBooks } from "../../../routes/admin/books/getBooks.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createTestDB,
  dropTestDB,
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;
let newAuthor;
let deletedBook, book1, book2;

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
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


//GETTING
describe("getting all valid books", () => {
  let mockReq, mockRes, deletedBook, jsonResponse;
  beforeAll(async() => {

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it("should return a list of all valid books", async() => {
    await getBooks(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted authors", async() => {
    expect(jsonResponse.includes(deletedBook)).toBeFalsy()
  })
})



// describe("getting all existing book titles", () => {
//   let mockReq, mockRes, deletedBook, jsonResponse;

//   beforeAll(async() => {
//     mockReq = {
//       prisma: prisma
//     }

//     mockRes = {
//       json: vi.fn(),
//       status: vi.fn().mockReturnThis()
//     }
//   })

//   it("should return a list of all valid book titles", async() => {
//     await getExistingBookTitles(mockReq, mockRes);
//     jsonResponse = mockRes.json.mock.calls[0][0]
//     expect(Array.isArray(jsonResponse)).toBe(true);
//   })

//   it("should only send out id, title and bookstoreId", async() => {
//     expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "title", "inventories"]);
//   })

//   it("should not contain deleted authors", async() => {
//     expect(jsonResponse.includes(deletedBook)).toBeFalsy()
//   })
// })