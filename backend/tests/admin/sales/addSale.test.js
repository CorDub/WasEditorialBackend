import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../../utils.js";
import { addSale } from "../../../routes/admin/sales/addSale.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB,
  createTransfer,
  truncateAll
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL = `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe("adding a valid sale", () => {
  let createdSale;
  let mockReq, mockRes;
  let author, book, bookstore, inventory, impression;

  beforeAll(async() => {
    const category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id], { categoryId: category.id });
    impression = await createImpression(prisma, book.id, { quantity: 1000 });
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id, {
      initial: 3000,
      current: 3000,
      returns: 0,
      givenToAuthor: 0
    });

    mockReq = {
      body: {
        bookId: book.id,
        bookstoreId: bookstore.id,
        quantity: 100,
        dateStr: "2024-11-22",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma);
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it("should create a sale in the database", async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it("should create a new Payment if no payments exist for this specific month", async() => {
    const createdPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: getForMonth(new Date("2024-11-22"))
        }
      }
    });
    expect(createdPayment).toBeTruthy();
  })

  it("should have correct data", async() => {
    const invCreatedSale = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: book.id,
          bookstoreId: bookstore.id
        }
      }
    });

    expect(createdSale.inventoryId).toBe(invCreatedSale.id);
    expect(createdSale.quantity).toBe(100);
    expect(createdSale.dateStr).toBe("2024-11-22");
  })
})


describe("adding a sale for a multi-authors book", () => {
  let createdSale;
  let mockReq, mockRes;
  let author1, author2, book, bookstore, inventory, impression;
  let newPayments;

  beforeAll(async() => {
    const category = await createCategory(prisma, { number: 100 });
    author1 = await createAuthor(prisma);
    author2 = await createAuthor(prisma);
    book = await createBook(prisma, [author1.id, author2.id], { categoryId: category.id });
    impression = await createImpression(prisma, book.id);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id, {
      initial: 3000,
      current: 3000
    });

    mockReq = {
      body: {
        bookId: book.id,
        bookstoreId: bookstore.id,
        quantity: 10,
        dateStr: "2024-11-22",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma);
  })

  it("should create a new Payment for every author of the book if it does not exist", async() => {
    await addSale(mockReq, mockRes);
    createdSale = mockRes.json.mock.calls[0][0];

    newPayments = await prisma.payment.findMany({
      where: {
        userId: { in: [author1.id, author2.id] },
        forMonth: "2024-11"
      }
    });

    expect(newPayments.length).toBe(2);
    expect(createdSale.payments[0].id).toEqual(newPayments[0].id);
    expect(createdSale.payments[1].id).toEqual(newPayments[1].id);
  })
})


describe("adding a sale larger than the remaining inventory", () => {
  let mockReq, mockRes, mute;
  let createdSale;
  let author, book, bookstore, inventory;

  beforeAll(async() => {
    const category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id], { categoryId: category.id });
    await createImpression(prisma, book.id, {quantity: 50});
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id, {
      initial: 50,
      current: 50
    });

    mockReq = {
      body: {
        bookId: book.id,
        bookstoreId: bookstore.id,
        quantity: 100,
        dateStr: "2024-11-22",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    await truncateAll(prisma);
    mute.mockRestore();
  })

  it("should not create a new sale if the inventory doesn't have enough books", async() => {
    await addSale(mockReq, mockRes);
    createdSale = mockRes.json.mock.calls[0][0];

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(createdSale).toEqual({ message: "El inventario tiene menos libros disponibles que la cantidad entrada." });
  })
})


describe("adding a sale but the payment is deleted", () => {
  let mockReq, mockRes, mute;
  let createdSale;
  let author, book, bookstore, inventory, oldPayment;

  beforeAll(async() => {
    const category = await createCategory(prisma);
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id], { categoryId: category.id });
    await createImpression(prisma, book.id, { quantity: 1000 });
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id, {
      initial: 3000,
      current: 3000,
      returns: 0,
      givenToAuthor: 0
    });

    await createPayment(prisma, author.id, getForMonth(new Date("2025-10-04")), { isDeleted: true });

    oldPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: getForMonth(new Date("2025-10-04"))
        }
      }
    });

    mockReq = {
      body: {
        bookId: book.id,
        bookstoreId: bookstore.id,
        quantity: 100,
        dateStr: "2025-10-04",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    await truncateAll(prisma);
    mute.mockRestore();
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it("should create a sale in the database", async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it("should destroy and recreate the payment", async() => {
    expect(oldPayment.isDeleted).toBe(true);

    const recreatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: getForMonth(new Date("2025-10-04"))
        }
      }
    });

    expect(recreatedPayment.isDeleted).toBe(false);
  })
})