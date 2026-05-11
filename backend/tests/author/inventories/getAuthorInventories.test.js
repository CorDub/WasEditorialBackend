import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getAuthorInventories
} from "../../../routes/author/inventories/getAuthorInventories.js";
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

describe("getAuthorInventories returns the correct values", async () => {
  let mockReq, mockRes, results;
  let category, author;
  let book, book2;
  let wasBookstore, otherBookstore;
  let wasInventory, otherInventory;
  let wasInventory2, otherInventory2;
  let payment;

  let impression, impression2, deletedImpression;
  let entregadoDelAutor, deletedEntregadoDelAutor;
  let transferTo, transferTo2, deletedTransferTo;
  let entregadoAlAutor, deletedEntregadoAlAutor;
  let transferFrom;
  let sale1, sale2, deletedSale;
  let sale3, sale4, deletedSale2;
  let sale5, deletedSale3;
  let sale6, deletedSale4;

  beforeAll(async () => {
    category = await createCategory(prisma);
    author = await createAuthor(prisma);

    book = await createBook(prisma, [author.id]);
    book2 = await createBook(prisma, [author.id]);

    wasBookstore = await createBookstore(prisma);   // must be id === 1
    otherBookstore = await createBookstore(prisma);

    wasInventory = await createInventory(prisma, book.id, wasBookstore.id);
    otherInventory = await createInventory(prisma, book.id, otherBookstore.id);
    wasInventory2 = await createInventory(prisma, book2.id, wasBookstore.id);
    otherInventory2 = await createInventory(prisma, book2.id, otherBookstore.id);

    payment = await createPayment(prisma, author.id, getForMonth(new Date()));

    // book impressions
    impression = await createImpression(prisma, book.id, { quantity: 500, date: new Date("2025-01-01") });
    impression2 = await createImpression(prisma, book.id, { quantity: 100 });
    deletedImpression = await createImpression(prisma, book.id, { quantity: 999, isDeleted: true });
    entregadoDelAutor = await createImpression(prisma, book.id, { quantity: 10, authorDelivery: true });
    deletedEntregadoDelAutor = await createImpression(prisma, book.id, { quantity: 5, authorDelivery: true, isDeleted: true });

    // book transfers out of WAS
    transferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 100 });
    transferTo2 = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 50 });
    deletedTransferTo = await createTransfer(prisma, wasInventory.id, { toInventoryId: otherInventory.id, quantity: 5, isDeleted: true });

    // entregado al autor
    entregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2 });
    deletedEntregadoAlAutor = await createTransfer(prisma, wasInventory.id, { quantity: 2, isDeleted: true });

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

    // book2 WAS sales
    sale5 = await createSale(prisma, wasInventory2.id, [payment.id], { quantity: 3 });
    deletedSale3 = await createSale(prisma, wasInventory2.id, [payment.id], { quantity: 10, isDeleted: true });

    // book2 other sales
    sale6 = await createSale(prisma, otherInventory2.id, [payment.id], { quantity: 1 });
    deletedSale4 = await createSale(prisma, otherInventory2.id, [payment.id], { quantity: 10, isDeleted: true });

    mockReq = {
      session: { user_id: author.id },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    await getAuthorInventories(mockReq, mockRes);
    results = mockRes.json.mock.calls[0][0];
    console.log("results.bookInventories", results.bookInventories);
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
  //   inicial = 500, extraImpressions = 100, entregadosDelAutor = 10
  //   transfers out = 150, entregadosAlAutor = 2, returns in = 20
  //   ventas = 3, disponibles = (500 + 100 + 10) - (150 + 2) + 20 - 3 = 475
  // book / other:
  //   transfers in = 150, returns out = 20, ventas = 3
  //   disponibles = 150 - 20 - 3 = 127
  // book / total: copias = 660, ventas = 6, disponibles = 602
  //
  // book2 / WAS:   ventas = 3, disponibles = wasInventory2.initial - 3
  // book2 / other: ventas = 1, disponibles = otherInventory2.initial - 1

  describe("authentication", () => {
    it("should return 401 if session has no user_id", async () => {
      const unauthReq = { session: {}, prisma };
      const unauthRes = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      await getAuthorInventories(unauthReq, unauthRes);
      expect(unauthRes.status).toHaveBeenCalledWith(401);
      expect(unauthRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });
  });

  describe("response shape", () => {
    it("should return an object with exactly 2 keys: summary and bookInventories", () => {
      expect(Object.keys(results)).toHaveLength(2);
      expect(results).toHaveProperty("summary");
      expect(results).toHaveProperty("bookInventories");
    });

    it("bookInventories should be an array with one entry per book", () => {
      expect(Array.isArray(results.bookInventories)).toBe(true);
      expect(results.bookInventories).toHaveLength(2);
    });

    it("summary should contain the expected keys", () => {
      const summaryKeys = ["initial", "impressions", "sold", "givenToAuthor", "total", "bookstores", "was"];
      for (const key of summaryKeys) {
        expect(results.summary).toHaveProperty(key);
      }
    });

    it("each bookInventory entry should contain the expected keys", () => {
      for (const entry of results.bookInventories) {
        expect(entry).toHaveProperty("bookId");
        expect(entry).toHaveProperty("title");
        expect(entry).toHaveProperty("summary");
        expect(entry).toHaveProperty("impressions");
      }
    });

    it("each bookInventory summary should contain the expected keys", () => {
      const summaryKeys = ["bookstores", "was", "givenToAuthor", "initial", "impressions", "sold", "total"];
      for (const entry of results.bookInventories) {
        for (const key of summaryKeys) {
          expect(entry.summary).toHaveProperty(key);
        }
      }
    });
  });

  describe("book-level inventory values (book 1)", () => {
    let bookResult;

    beforeAll(() => {
      bookResult = results.bookInventories.find(b => b.bookId === book.id);
    });

    it("should find book in bookInventories with the correct title", () => {
      expect(bookResult).toBeDefined();
      expect(bookResult.title).toBe(book.title);
    });

    it("should compute correct WAS disponibles", () => {
      expect(bookResult.summary.was).toBe(475);
    });

    it("should compute correct bookstores disponibles", () => {
      expect(bookResult.summary.bookstores).toBe(127);
    });

    it("should compute correct total remaining", () => {
      expect(bookResult.summary.total).toBe(602);
    });

    it("should compute correct sold count (WAS + other, deleted excluded)", () => {
      expect(bookResult.summary.sold).toBe(6);
    });

    it("should compute correct extraImpressions (not including inicial or entregadosDelAutor)", () => {
      expect(bookResult.summary.impressions).toBe(100);
    });

    it("should compute correct givenToAuthor", () => {
      expect(bookResult.summary.givenToAuthor).toBe(2);
    });

    it("should not count deleted impressions", () => {
      // deletedImpression quantity was 999 — WAS would be 1474 if counted
      expect(bookResult.summary.was).toBe(475);
    });

    it("should not count deleted sales", () => {
      // each deleted sale had quantity 4 — sold would be 14 if counted
      expect(bookResult.summary.sold).toBe(6);
    });

    it("should not count deleted transfers", () => {
      // deletedTransferTo had quantity 5 — bookstores would be 132 if counted
      expect(bookResult.summary.bookstores).toBe(127);
    });
  });

  describe("overall summary values", () => {
    it("summary.sold should be the sum of all books' sold", () => {
      const totalSold = results.bookInventories.reduce((sum, b) => sum + b.summary.sold, 0);
      expect(results.summary.sold).toBe(totalSold);
    });

    it("summary.total should be the sum of all books' total", () => {
      const totalRemaining = results.bookInventories.reduce((sum, b) => sum + b.summary.total, 0);
      expect(results.summary.total).toBe(totalRemaining);
    });

    it("summary.was should be the sum of all books' WAS disponibles", () => {
      const totalWas = results.bookInventories.reduce((sum, b) => sum + b.summary.was, 0);
      expect(results.summary.was).toBe(totalWas);
    });

    it("summary.bookstores should be the sum of all books' bookstore disponibles", () => {
      const totalBookstores = results.bookInventories.reduce((sum, b) => sum + b.summary.bookstores, 0);
      expect(results.summary.bookstores).toBe(totalBookstores);
    });

    it("summary.impressions should be the sum of all books' extra impressions", () => {
      const totalImpressions = results.bookInventories.reduce((sum, b) => sum + b.summary.impressions, 0);
      expect(results.summary.impressions).toBe(totalImpressions);
    });

    it("summary.givenToAuthor should be the sum of all books' givenToAuthor", () => {
      const totalGiven = results.bookInventories.reduce((sum, b) => sum + b.summary.givenToAuthor, 0);
      expect(results.summary.givenToAuthor).toBe(totalGiven);
    });

    it("summary.total should equal summary.was + summary.bookstores", () => {
      expect(results.summary.total).toBe(results.summary.was + results.summary.bookstores);
    });

    it("impressions array entries should contain quantity and date", () => {
      const bookResult = results.bookInventories.find(b => b.bookId === book.id);
      expect(bookResult.impressions.length).toBeGreaterThan(0);
      for (const impression of bookResult.impressions) {
        expect(impression).toHaveProperty("quantity");
        expect(impression).toHaveProperty("dateStr");
      }
    });
  });

  describe("edge cases", () => {
    it("should return 500 on a database error", async () => {
      const badReq = {
        session: { user_id: author.id },
        prisma: {
          user: {
            findUnique: vi.fn().mockRejectedValue(new Error("DB failure"))
          }
        }
      };
      const errRes = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      await getAuthorInventories(badReq, errRes);
      expect(errRes.status).toHaveBeenCalledWith(500);
      expect(errRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  describe("impressions ordering and filtering", () => {
    it("should return impressions ordered ascending by date with no deleted impressions for each book", () => {
      for (const entry of results.bookInventories) {
        // No deleted impressions
        for (const impression of entry.impressions) {
          expect(impression.isDeleted).toBeFalsy();
        }

        // Ordered ascending by dateStr
        for (let i = 1; i < entry.impressions.length; i++) {
          expect(entry.impressions[i].dateStr >= entry.impressions[i - 1].dateStr).toBe(true);
        }
      }
    });
  });
});