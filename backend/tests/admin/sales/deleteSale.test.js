import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteSale } from "../../../routes/admin/sales/deleteSale.js";
import { getInventoryDerived } from "../../../routes/admin/inventories/inventoryHelpers.js";
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
  truncateAll,
  createTransfer
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import { getForMonth } from "../../../utils.js";

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


// DELETING
describe(`deleting a sale with valid parameters`, async() => {
  let mockReq, mockRes;
  let author, book, bookstore, bookstore2, inventory, inventory2, payment, sale, sale2;
  let category;
  let impression;
  let transfer;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    impression = await createImpression(prisma, book.id, {quantity: 3000})
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory  = await createInventory(prisma, book.id, bookstore.id,  { initial: 3000, current: 2900 });
    payment = await createPayment(prisma, author.id, getForMonth(new Date("2025-11-02")));
    sale  = await createSale(prisma, inventory.id,  [payment.id], { quantity: 100 });

    mockReq = {
      params: { id: sale.id },
      query:  { inventory_id: inventory.id },
      prisma
    }

    mockRes = {
      json:   vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    await deleteSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the sale as deleted", async() => {
    updatedSale = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(updatedSale.isDeleted).toBe(true);
  })

  it("should return the quantity to the current inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        },
        bookstore: true,
        sales: true,
        transfersFrom: true,
        transfersTo: true
      }
    })
    const updatedInventoryDerived = getInventoryDerived(updatedInventory)
    expect(updatedInventoryDerived.disponibles).toBe(3000);
  })
})