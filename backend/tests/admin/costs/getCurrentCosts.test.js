import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getCurrentCosts } from "../../../routes/admin/costs/getCurrentCosts.js";
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
  deleteFromDB
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



describe('getting all valid current costs', async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment, newCost2, deletedCost, costFromDeletedPayment, createdPayment2;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 2});
    newCategory2 = await createCategory(prisma, {number: 3});
    newAuthor = await createAuthor(prisma, {categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, {categoryId: newCategory.id})
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newBookstore = await createBookstore(prisma)
    newBookstoreComissions = await createBookstore(prisma, {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 900})
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, {initial: 1000, current: 900})
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    createdPayment2 = await createPayment(prisma, newAuthor2.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale3 = await createSale(prisma, newInventory2.id, [newPayment.id, newPayment2.id], {quantity: 100})
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100, isDeleted: true})
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, regalias: 100, isDeleted: true})
    newCost = await createCost(prisma, createdPayment.id, newBook.id, {amount: 100, note : "newCost"});
    newCost2 = await createCost(prisma, createdPayment.id, newBook.id, {amount: 100, note : "newCost2"});
    deletedCost = await createCost(prisma, createdPayment2.id, newBook.id, {amount: 100, isDeleted: true, note: "deletedCost"});
    costFromDeletedPayment = await createCost(prisma, deletedPayment.id, newBook.id, {amount:100, note : "costeFromDeletedPayment"});

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await getCurrentCosts(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should not return deleted Costs or costs from deleted payments`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0];
    expect(jsonResponse.length).toBe(2);
    for (const cost of jsonResponse) {
      try {
        expect([newCost.id, newCost2.id]).toContain(cost.id)
      } catch(error) {
        console.log(`error at the cost with the id ${cost.id}`)
        throw new Error('noppppppe')
      }
    }
  })
})