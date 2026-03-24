import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { checkRemainingAvailablesForThisBook } from "../../../routes/admin/impressions/impressionHelpers.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createTransfer,
  createTestDB,
  dropTestDB,
  truncateAll
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

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



describe(`checkRemainingAvailablesForThisBook works as expected when not enough remaining`, async() => {
  let author;
  let category;
  let book;
  let impression;
  let bookstore;
  let bookstore2;
  let inventory;
  let inventory2;
  let transfer;
  let payment;
  let sale;
  let sale2;
  
  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    impression = await createImpression(prisma, book.id, {quantity: 1000})
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    transfer = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 500})
    payment = await createPayment(prisma, author.id, "2026-03")
    sale = await createSale(prisma, inventory.id, [payment.id], {quantity: 500})
    sale2 = await createSale(prisma, inventory2.id, [payment.id], {quantity: 300})

    // 1 book 2 inventories with 500 inicial each
    // inventory has 0 disponibles
    // inventory2 has 200 disponibles
    // total disponibles is 200
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return false when there is less available copies in total than in the impression`, async() => {
    const res = await checkRemainingAvailablesForThisBook(prisma, impression.id)
    expect(res).toBe(false)
  })
})

describe(`checkRemainingAvailablesForThisBook works as expected when there are enough copies remaining`, async() => {
  let author;
  let category;
  let book;
  let impression;
  let bookstore;
  let bookstore2;
  let inventory;
  let inventory2;
  let transfer;
  let payment;
  // let sale;
  // let sale2;
  
  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    impression = await createImpression(prisma, book.id, {quantity: 1000})
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    transfer = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 500})
    payment = await createPayment(prisma, author.id, "2026-03")
    // sale = await createSale(prisma, inventory.id, [payment.id], {quantity: 500})
    // sale2 = await createSale(prisma, inventory2.id, [payment.id], {quantity: 300})

    // 1 book 2 inventories with 500 inicial each
    // inventory has 500 disponibles
    // inventory2 has 500 disponibles
    // total disponibles is 1000
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return true when there are enough available copies in total`, async() => {
    const res = await checkRemainingAvailablesForThisBook(prisma, impression.id)
    expect(res).toBe(true)
  })
})