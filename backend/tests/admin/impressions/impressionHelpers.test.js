import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { validateAuthorReturn } from "../../../routes/admin/impressions/impressionHelpers.js";
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

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe(`validateAuthorReturn - less returns than delivered`, async() => {
  let author;
  let category;
  let book;
  let impression;
  let bookstore;
  let inventory;
  let transferToAutor;
  let transferFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    impression = await createImpression(prisma, book.id)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    transferToAutor = await createTransfer(prisma, inventory.id, {quantity: 10})
    transferFromAuthor = await createImpression(prisma, book.id, {authorDelivery: true, quantity: 2})
  })

  afterAll(async() => {
    await truncateAll(prisma)
  }) 

  it(`should return true`, async() => {
    const res = await validateAuthorReturn(prisma, book.id, 4)
    expect(res).toBe(true)
  })
})


describe(`validateAuthorReturn - more returns than delivered`, async() => {
  let author;
  let category;
  let book;
  let impression;
  let bookstore;
  let inventory;
  let transferToAutor;
  let transferFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    impression = await createImpression(prisma, book.id)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    transferToAutor = await createTransfer(prisma, inventory.id, {quantity: 10})
    transferFromAuthor = await createImpression(prisma, book.id, {authorDelivery: true, quantity: 2})
  })

  afterAll(async() => {
    await truncateAll(prisma)
  }) 

  it(`should return false`, async() => {
    const res = await validateAuthorReturn(prisma, book.id, 10)
    expect(res).toBe(false)
  })
})