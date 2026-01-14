import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { calculateAuthorRevenue } from "../../utils.js";
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



describe(`calculate the author revenue for a comission book in WAS below management min`, () => {
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
    inventory = await createInventory(prisma, book.id, wasBookstore.id, {price: 300})
  })

  it(`should return the correct revenue for the author`, async() => {
    results = calculateAuthorRevenue(
      category.category_type,
      inventory.price,
      wasBookstore.deal_percentage,
      wasBookstore.id,
      category.percentage_royalties,
      category.rebate_author,
      category.percentage_management_stores,
      category.management_min,
      quantity,
      false
    )
    expect(results).toBe(480)
  })
})



describe(`calculate the author revenue for a comission book in WAS above management min`, () => {
  let category;
  let author;
  let book;
  let inventory;
  let quantity = 4;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "comissions", number: 2})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    inventory = await createInventory(prisma, book.id, wasBookstore.id)
  })

  it(`should return the correct revenue for the author`, async() => {
    results = calculateAuthorRevenue(
      category.category_type,
      inventory.price,
      wasBookstore.deal_percentage,
      wasBookstore.id,
      category.percentage_royalties,
      category.rebate_author,
      category.percentage_management_stores,
      category.management_min,
      quantity,
      false
    )
    expect(results).toBe(758)
  })
})



describe(`calculate the author revenue for a comission book in any other bookstore`, () => {
  let category;
  let author;
  let book;
  let otherBookstore;
  let inventory;
  let quantity = 4;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "comissions", number: 3})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    otherBookstore = await createBookstore(prisma, {deal_percentage: 50})
    inventory = await createInventory(prisma, book.id, otherBookstore.id, {price: 400})
  })

  it(`should return the correct revenue for the author`, async() => {
    results = calculateAuthorRevenue(
      category.category_type,
      inventory.price,
      otherBookstore.deal_percentage,
      otherBookstore.id,
      category.percentage_royalties,
      category.rebate_author,
      category.percentage_management_stores,
      category.management_min,
      quantity,
      false
    )
    expect(results).toBe(720)
  })
})



describe(`calculate the author revenue for a regalias book`, () => {
  let category;
  let author;
  let book;
  let otherBookstore;
  let inventory;
  let quantity = 4;
  let results;

  beforeAll(async() => {
    category = await createCategory(prisma, {category_type: "regalias", number: 4})
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id], {categoryId: category.id})
    otherBookstore = await createBookstore(prisma, {deal_percentage: 50})
    inventory = await createInventory(prisma, book.id, otherBookstore.id, {price: 379})
  })

  it(`should return the correct revenue for the author`, async() => {
    results = calculateAuthorRevenue(
      category.category_type,
      inventory.price,
      otherBookstore.deal_percentage,
      otherBookstore.id,
      category.percentage_royalties,
      category.rebate_author,
      category.percentage_management_stores,
      category.management_min,
      quantity,
      false
    )
    expect(results).toBe(303.2)
  })
})