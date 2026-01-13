import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addCategory } from "../../routes/adminRoutes.js";
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
let deletedCategory, category1, previouslyAddedCategory;
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
  deletedCategory = await createCategory(prisma, {number: 2, isDeleted: true});
  previouslyAddedCategory = await createCategory(prisma, {number: 3, management_min: 180.25})
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



// ADDING
describe("adding a valid category", () => {
  let mockReq, mockRes, addedCategory;

  beforeAll(async() => {
    mockReq = {
      body: {
        "number": 4,
        "type": "regalias",
        "gestionMinima": "180.25",
        "regalias": "20"
      }, 
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })
  
  it("should return status 201 and return json with name", async() => {
    addedCategory = await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": 4,
    })
  })

  it("should create the category in the database with the correct data", async() => {
    addedCategory = await prisma.category.findUnique({
      where: {
        number: 4
      }
    })
    expect(addedCategory).toBeTruthy();
    expect(addedCategory.number).toBe(4);
    expect(addedCategory.management_min).toBe(180.25);
  })
})


describe("adding an invalid category", () => {
  let mockReq, mockRes, notAddedCategory, mute;

  beforeAll(async() => {
    mockReq = {
      body: {
        "number": 6,
        "gestionMinima": "",
      }, 
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => { mute.mockRestore() })

  it("should return status 500", async() => {
    await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new category", async() => {
    notAddedCategory = await prisma.category.findUnique({
      where: {
        number: 6
      }
    })
    expect(notAddedCategory).toBeFalsy;
  })
})


describe("adding a duplicate category", () => {
  let mockReq, mockRes, mute;

  beforeAll(async() => {
    mockReq = {
      body: {
        "number": 4,
        "type": "regalias",
        "gestionMinima": "180.25",
        "regalias": "20"
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
    
    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("should return status 500", async() => {
    await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new category", async() => {
    const premiumCategories = await prisma.category.findMany({
      where: {
        number: 4
      }
    })
    expect(premiumCategories.length).toBe(1);
  })

  afterAll(async() => {
    mute.mockRestore();
  })
})