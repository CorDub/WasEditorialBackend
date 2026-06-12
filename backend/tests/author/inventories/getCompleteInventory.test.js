import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getCompleteInventory
} from "../../../routes/author/inventories/getCompleteInventory.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createTestDB,
  dropTestDB,
  createTransfer,
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

afterAll(async() =>  {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe("getCompleteInventory returns the correct values", async () => {
  let mockReq, mockRes, results;
  let category, author, otherAuthor;
  let book, book2;
  let wasBookstore, otherBookstore, thirdBookstore;
  let wasInventory, otherInventory;
  let wasInventory2, otherInventory2;
  let deletedInventory;
  let payment;

  let impression, impression2, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, deletedTransferTo;
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;
  let sale3, sale4, deletedSale2;
  let sale5, sale6;

  beforeAll(async () => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);
    otherAuthor = await createAuthor(prisma);

    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);

    wasBookstore = await createBookstore(prisma);   // id === 1
    otherBookstore = await createBookstore(prisma);
    thirdBookstore = await createBookstore(prisma);

    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    wasInventory2 = await createInventory(prisma, book2.id, wasBookstore.id);
    otherInventory2 = await createInventory(prisma, book2.id, otherBookstore.id);
    deletedInventory = await createInventory(prisma, book.id, thirdBookstore.id, { isDeleted: true });

    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // book impressions
    impression = await createImpression(prisma, book.id, { quantity: 500, date: new Date("2025-01-01") });
    impression2 = await createImpression(prisma, book.id, { quantity: 100 });
    deletedImpression = await createImpression(prisma, book.id, { quantity: 999, isDeleted: true });

    // book transfers out of WAS
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });

    // entregados al autor
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 12 });
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2, isDeleted: true });
    // entregadoDelAutor = await createImpression(prisma, book.id, { quantity: 10, authorDelivery: true });
    // deletedEntregadoDelAutor = await createImpression(prisma, book.id, { quantity: 5, authorDelivery: true, isDeleted: true });
    entregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 10})
    deletedEntregadoDelAutor = await createTransfer(prisma, null, {toInventoryId: wasInventory.id, quantity: 5, isDeleted: true})

    // return from other back to WAS
    transferFrom = await createTransfer(prisma, otherInventory.id, { toInventoryId: wasInventory.id, quantity: 20 });

    // book WAS sales
    sale1 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 2 });
    sale2 = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 1 });
    deletedSale = await createSale(prisma, wasInventory.id, [payment.id], { quantity: 4, isDeleted: true });

    // book other sales
    sale3 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 2 });
    sale4 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 1 });
    deletedSale2 = await createSale(prisma, otherInventory.id, [payment.id], { quantity: 4, isDeleted: true });

    // book2 sales (no impressions or transfers)
    sale5 = await createSale(prisma, wasInventory2.id, [payment.id], { quantity: 3 });
    sale6 = await createSale(prisma, otherInventory2.id, [payment.id], { quantity: 1 });

    mockReq = {
      session: { user_id: author.id },
      prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    await getCompleteInventory(mockReq, mockRes);
    results = mockRes.json.mock.calls[0][0];
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Inventory",
        "Transfer",
        "Sale",
        "Impression",
        "Book",
        "Bookstore",
        "User",
        "Category",
        "Payment"
      RESTART IDENTITY CASCADE;
    `);
  });

  // book / WAS:
  //   impressionInicial=500, extraImpressions=100, entregadosDelAutor=10
  //   transfers=150, entregadosAlAutor=12, returns=20, ventas=3
  //   copias = 500+100-150 = 450
  //   current (disponibles) = 450 - 3 + 20 - 12 + 10 = 465
  // book / other:
  //   inicial=100, extraTransfers=50, returns=20, ventas=3
  //   copias = 150, current (disponibles) = 150 - 20 - 3 = 127

  describe("authentication", () => {
    it("should return 401 if session has no user_id", async () => {
      const unauthReq = { session: {}, prisma };
      const unauthRes = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      await getCompleteInventory(unauthReq, unauthRes);
      expect(unauthRes.status).toHaveBeenCalledWith(401);
      expect(unauthRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });
  });

  describe("response shape", () => {
    it("should return an array", () => {
      expect(Array.isArray(results)).toBe(true);
    });

    it("should return one entry per inventory", () => {
      expect(results).toHaveLength(4);
    });

    it("each entry should have the expected keys", () => {
      for (const entry of results) {
        expect(entry).toHaveProperty("book");
        expect(entry).toHaveProperty("bookstore");
        expect(entry).toHaveProperty("current");
        expect(entry).toHaveProperty("givenToAuthor");
        expect(entry).toHaveProperty("returns");
        expect(entry).toHaveProperty("sold");
      }
    });

    it("each entry's book should have id and title", () => {
      for (const entry of results) {
        expect(entry.book).toHaveProperty("id");
        expect(entry.book).toHaveProperty("title");
      }
    });

    it("each entry's bookstore should have id and name", () => {
      for (const entry of results) {
        expect(entry.bookstore).toHaveProperty("id");
        expect(entry.bookstore).toHaveProperty("name");
      }
    });
  });

  describe("WAS inventory values (book 1)", () => {
    let wasResult;

    beforeAll(() => {
      wasResult = results.find(
        e => e.book.id === book.id && e.bookstore.id === wasBookstore.id
      );
    });

    it("should find the WAS entry for book 1", () => {
      expect(wasResult).toBeDefined();
    });

    it("should have correct book and bookstore info", () => {
      expect(wasResult.book.title).toBe(book.title);
      expect(wasResult.bookstore.name).toBe(wasBookstore.name);
    });

    it("should return correct sold (deleted excluded)", () => {
      expect(wasResult.sold).toBe(3);
    });

    it("should return correct current (disponibles)", () => {
      expect(wasResult.current).toBe(465);
    });

    it("should return correct returns", () => {
      expect(wasResult.returns).toBe(20);
    });

    it("should return correct givenToAuthor", () => {
      expect(wasResult.givenToAuthor).toBe(2);
    });
  });

  describe("other bookstore inventory values (book 1)", () => {
    let otherResult;

    beforeAll(() => {
      otherResult = results.find(
        e => e.book.id === book.id && e.bookstore.id === otherBookstore.id
      );
    });

    it("should find the other bookstore entry for book 1", () => {
      expect(otherResult).toBeDefined();
    });

    it("should have correct book and bookstore info", () => {
      expect(otherResult.book.title).toBe(book.title);
      expect(otherResult.bookstore.name).toBe(otherBookstore.name);
    });

    it("should return correct sold (deleted excluded)", () => {
      expect(otherResult.sold).toBe(3);
    });

    it("should return correct current (disponibles)", () => {
      expect(otherResult.current).toBe(127);
    });

    it("should return correct returns", () => {
      expect(otherResult.returns).toBe(20);
    });

    it("should return 0 for givenToAuthor (not tracked for other inventories)", () => {
      expect(otherResult.givenToAuthor).toBe(0);
    });
  });

  describe("scope — only returns the author's own inventories", () => {
    it("should not include inventories from books belonging to a different author", async () => {
      const otherAuthorBook = await createBook(prisma, [otherAuthor.id]);
      await createInventory(prisma, otherAuthorBook.id, wasBookstore.id);

      const freshRes = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      await getCompleteInventory(mockReq, freshRes);
      const freshResults = freshRes.json.mock.calls[0][0];

      expect(freshResults.find(e => e.book.id === otherAuthorBook.id)).toBeUndefined();
    });

    it("should not include deleted inventories", async () => {
      expect(results.find(e => e.bookstore.id === thirdBookstore.id)).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should return 500 on a database error", async () => {
      const badReq = {
        session: { user_id: author.id },
        prisma: {
          inventory: {
            findMany: vi.fn().mockRejectedValue(new Error("DB failure"))
          }
        }
      };
      const errRes = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      await getCompleteInventory(badReq, errRes);
      expect(errRes.status).toHaveBeenCalledWith(500);
      expect(errRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });
});