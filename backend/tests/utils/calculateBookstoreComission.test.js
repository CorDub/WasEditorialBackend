import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { calculateBookstoreComission, calculateAuthorRevenue } from "../../utils.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createTestDB,
  dropTestDB,
} from "../../testUtils.js"
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let wasBookstore;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  wasBookstore = await createBookstore(prisma, {deal_percentage: 50})
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



describe(`calculate the bookstore com for WAS / comission / below management min`, () => {
  let category;
  let author;
  let book;
  let inventory;
  let quantity = 4;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "comissions"})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    inventory = await createInventory(prisma, book.id, wasBookstore.id, {price: 299.99})
  })

  it(`should return the correct bookstore comission per book`, async() => {
    results = calculateBookstoreComission(
      category.category_type,
      inventory.price,
      wasBookstore.deal_percentage,
      wasBookstore.id,
      category.percentage_royalties,
      category.percentage_management_stores,
      category.management_min,
    )
    expect(results).toBe(180)
  })
})



describe(`calculate the bookstore com for WAS / comission / above management min`, () => {
  let category;
  let author;
  let book;
  let inventory;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "comissions", number: 2})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    inventory = await createInventory(prisma, book.id, wasBookstore.id)
  })

  it(`should return the correct bookstore comission per book`, async() => {
    results = calculateBookstoreComission(
      category.category_type,
      inventory.price,
      wasBookstore.deal_percentage,
      wasBookstore.id,
      category.percentage_royalties,
      category.percentage_management_stores,
      category.management_min,
    )
    expect(results).toBe(189.5)
  })
})



describe(`calculate the bookstore com for any other bookstore on comission deal`, () => {
  let category;
  let author;
  let book;
  let otherBookstore;
  let inventory;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "comissions", number: 3})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    otherBookstore = await createBookstore(prisma, {deal_percentage: 50})
    inventory = await createInventory(prisma, book.id, otherBookstore.id, {price: 400})
  })

  it(`should return the correct bookstore comission per book`, async() => {
    results = calculateBookstoreComission(
      category.category_type,
      inventory.price,
      otherBookstore.deal_percentage,
      otherBookstore.id,
      category.percentage_royalties,
      category.percentage_management_stores,
      category.management_min,
    )
    expect(Number(results.toFixed(0))).toBe(220)
  })
})



describe(`calculate the bookstore com for any other bookstore on regalias deal`, () => {
  let category;
  let author;
  let book;
  let otherBookstore;
  let inventory;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "regalias", number: 4})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    otherBookstore = await createBookstore(prisma, {deal_percentage: 50})
    inventory = await createInventory(prisma, book.id, otherBookstore.id, {price: 379})
  })

  it(`should return the correct bookstore comission per book`, async() => {
    results = calculateBookstoreComission(
      category.category_type,
      inventory.price,
      otherBookstore.deal_percentage,
      otherBookstore.id,
      category.percentage_royalties,
      category.percentage_management_stores,
      category.management_min,
    )
    expect(results).toBe(303.2)
  })
})