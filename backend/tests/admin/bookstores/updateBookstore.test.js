import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateBookstore } from "../../../routes/admin/bookstores/updateBookstore.js";
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



describe("updating a bookstore with valid parameters", () => {
  let newBookstore, mockReq, mockRes;
  let updatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma);

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "Updated Bookstore",
        "dealPercentage": "50",
        "contactName": "Bookstore Owner Updated",
        "contactPhone": "5544809021",
        "contactPhonePrefix": "+44",
        "contactEmail": "bookstore.owner@gmail.com",
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  it("should return status 200", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should update the bookstore with the correct data in the database", async() => {
    updatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    expect(updatedBookstore).toBeTruthy();
    expect(updatedBookstore.name).toBe("Updated Bookstore");
    expect(updatedBookstore.deal_percentage).toBe(50);
    expect(updatedBookstore.contact_name).toBe("Bookstore Owner Updated");
    expect(updatedBookstore.contact_phone).toBe("5544809021");
    expect(updatedBookstore.contact_phone_prefix).toBe("+44");
    expect(updatedBookstore.contact_email).toBe("bookstore.owner@gmail.com");
  })
})



describe("updating a bookstore with invalid parameters", async() => {
  let newBookstore, mockReq, mockRes, mute;
  let notUpdatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma);

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "",
        "dealPercentage": "cinquanta",
        "contactName": 15240,
        "contactPhone": "5544809021215485",
        "contactPhonePrefix": "+44",
        "contactEmail": "bookstore.owner@gmailcom",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async() => {
    mute.mockRestore()
  });

  it("should return status 500", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the bookstore in the database", async() => {
    notUpdatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    expect(notUpdatedBookstore).toBeTruthy();
    expect(notUpdatedBookstore.name).toBe(newBookstore.name);
  })
})



describe("updating a deleted bookstore", async() => {
  let newBookstore, mockReq, mockRes, mute;
  let notUpdatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma, {isDeleted: true});

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "Updated Bookstore",
        "dealPercentage": "50",
        "contactName": "Bookstore Owner Updated",
        "contactPhone": "5544809021",
        "contactPhonePrefix": "+44",
        "contactEmail": "bookstore.owner@gmail.com",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  });

  it("should return status 500", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the bookstore in the database", async() => {
    notUpdatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    expect(notUpdatedBookstore).toBeTruthy();
    expect(notUpdatedBookstore.name).toBe(newBookstore.name);
  })
})