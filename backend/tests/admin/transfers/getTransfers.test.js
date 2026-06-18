import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { 
  getTransfers
} from "../../../routes/admin/transfers/getTransfers.js";
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
  truncateAll,
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


describe("getTransfers - get all transfers, exclude deleted", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;

  let send1, send2, deletedSend;
  let return1, return2, deletedReturn;

  let delivery1, delivery2, deletedDelivery;
  let devolucion1, devolucion2, deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    
    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100})
    send2 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100, isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 50})
    return2 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 50})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 100, isDeleted: true})

    delivery1 = await createTransfer(prisma, inventory2.id, {quantity: 10})
    delivery2 = await createTransfer(prisma, inventory2.id, {quantity: 10})
    deletedDelivery = await createTransfer(prisma, inventory2.id, {quantity: 100, isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5})
    devolucion2 = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 100, isDeleted: true})

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await getTransfers(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a list", async() => {
    expect(Array.isArray(jsonResponse)).toBe(true)
  })

  it("should return all transfers", async() => {
    expect(jsonResponse.length).toBe(8)
  })

  it("should not include any deleted transfers", async() => {
    let deleted = [];
    for (const transfer of jsonResponse) {
      if (transfer.isDeleted) {
        deleted.push(transfer)
      }
    }
    expect(deleted.length).toBe(0)
  })
})



describe("getTransfers - sort", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;

  let send1, send2, deletedSend;
  let return1, return2, deletedReturn;

  let delivery1, delivery2, deletedDelivery;
  let devolucion1, devolucion2, deletedDevolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    
    send1 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100, dateStr: "2026-06-01", updateAt: new Date("2026-06-01")})
    send2 = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100, dateStr: "2026-06-01", updatedAt: new Date("2026-06-15")})
    deletedSend = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 100, isDeleted: true})

    return1 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 50, dateStr: "2026-06-04"})
    return2 = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 50, dateStr: "2026-06-03"})
    deletedReturn = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 100, isDeleted: true})

    delivery1 = await createTransfer(prisma, inventory2.id, {quantity: 10, dateStr: "2026-06-06"})
    delivery2 = await createTransfer(prisma, inventory2.id, {quantity: 10, dateStr: "2026-06-05"})
    deletedDelivery = await createTransfer(prisma, inventory2.id, {quantity: 100, isDeleted: true})

    devolucion1 = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr: "2026-06-08"})
    devolucion2 = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr: "2026-06-07"})
    deletedDevolucion = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 100, isDeleted: true})

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await getTransfers(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("sorts by dateStr descending first", async() => {
    expect(jsonResponse[0].id).toBe(devolucion1.id)
    expect(jsonResponse[1].id).toBe(devolucion2.id)
    expect(jsonResponse[2].id).toBe(delivery1.id)
    expect(jsonResponse[3].id).toBe(delivery2.id)
    expect(jsonResponse[4].id).toBe(return1.id)
    expect(jsonResponse[5].id).toBe(return2.id)
  })

  it("sorts by updatedAt descending if equality", async() => {
    expect(jsonResponse[6].id).toBe(send2.id)
    expect(jsonResponse[7].id).toBe(send1.id)
  })
})