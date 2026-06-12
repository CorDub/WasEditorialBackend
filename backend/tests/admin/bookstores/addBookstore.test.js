import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addBookstore } from "../../../routes/admin/bookstores/addBookstore.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createTestDB,
  dropTestDB,
} from "../../../testUtils.js";
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



describe("adding a valid bookstore", () => {
  let mockReq, mockRes, addedBookstore;
  
  beforeAll(async() => {
    mockReq = {
      body: {
        "name": "New Bookstore",
        "dealPercentage": "50",
        "contactName": "Bookstore Owner",
        "contactPhonePrefix": "+52",
        "contactPhone": "5544809021",
        "contactEmail": "bookstore.owner@gmail.com",
        "wasRed": false
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })
  
  it("should return status 201 and return json with name", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": "New Bookstore",
    })
  })

  it("should create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: "New Bookstore"}})
    expect(addedBookstore).toBeTruthy();
  })

  it("should have correct data", async() => {
    expect(addedBookstore.name).toBe("New Bookstore");
    expect(addedBookstore.deal_percentage).toBe(50);
    expect(addedBookstore.contact_name).toBe("Bookstore Owner");
    expect(addedBookstore.contact_phone).toBe("5544809021");
    expect(addedBookstore.contact_phone_prefix).toBe('+52');
    expect(addedBookstore.contact_email).toBe("bookstore.owner@gmail.com");
  })
})



describe("adding an invalid bookstore", () => {
  let mockReq, mockRes, addedBookstore, mute;
  
  beforeAll(async() => {
    mockReq = {
      body: {
        "name": "",
        "dealPercentage": "cinquanta",
        "comissions": "not true",
        "contactName": 15240,
        "contactPhone": "5544809021215485",
        "contactPhonePrefix": "+52",
        "contactEmail": "bookstore.owner@gmailcom",
      }, 
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })
  
  afterAll(async() => { mute.mockRestore() })

  it("should return status 500", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: ""}})
    expect(addedBookstore).toBeFalsy();
  })
})



describe("adding a duplicate bookstore", async() => {
  let addedBookstore, previousBookstore, mockReq, mockRes, mute;

  beforeAll(async() => {
    previousBookstore = await createBookstore(prisma, {name:"Ye Olde Bookstore"});

    mockReq = {
      body: {
        "name": "Ye Olde Bookstore",
        "dealPercentage": "50",
        "comissions": "true",
        "contactName": "Bookstore Owner",
        "contactPhone": "5544809021",
        "contactPhonePrefix": "+52",
        "contactEmail": "bookstore.owner@gmail.com",
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => { mute.mockRestore() })

  it("should return status 500", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: "Ye Olde Bookstore"}})
    expect(addedBookstore.id).toBe(previousBookstore.id);
  })
})