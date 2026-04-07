import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateBook, updateBookPrices } from "../../../routes/admin/books/updateBookPrices.js";
import {
  createAuthor,
  createBook,
  createTestDB,
  dropTestDB,
  createCategory,
  createBookstore,
  createInventory
} from "../../../testUtils.js";
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
  wasBookstore = await createBookstore(prisma, {name: "WAS Editorial"});
})

afterAll(async() => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe("updating prices for a given book", async() => {
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let updatedInventory1, updatedInventory2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": 299.99
          },
          {
            "inventoryId": inventory2.id,
            "price": 349.99
          }
        ]
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should respond with a status 200", async() => {
    await updateBookPrices(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should update the price for all inventories in the database", async() => {
    updatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(updatedInventory1.price).toBe(299.99)
    updatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(updatedInventory2.price).toBe(349.99)
  })
})



describe('updating prices for a book with invalid data', async() => {
  let mockReq, mockRes, mute;
  let newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000, price: 499.99});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000, price: 499.99});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": "dos cientos noventa y nueve pesos"
          },
          {
            "inventoryId": inventory2.id,
            "price": -349.99
          }
        ]
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => {mute.mockRestore()})

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should not update the price for all inventories in the database", async() => {
    notUpdatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(notUpdatedInventory1.price).toBe(499.99)
    notUpdatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(notUpdatedInventory2.price).toBe(499.99)
  })
})



describe("updating prices for a deleted book", async() => {
  let mockReq, mockRes, mute;
  let newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000, price: 499.99});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000, price: 499.99});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": 249.99
          },
          {
            "inventoryId": inventory2.id,
            "price": 349.99
          }
        ]
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should not update the price for all inventories in the database", async() => {
    notUpdatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(notUpdatedInventory1.price).toBe(499.99)
    notUpdatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(notUpdatedInventory2.price).toBe(499.99)
  })
})