import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteImpression } from "../../../routes/admin/impressions/deleteImpression.js";
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


//DELETING
describe(`deleting an impression with valid parameters`, async() => {
  let mockReq, mockRes;
  let updatedImpression;
  let category1, newAuthor, newBook, bodegaWas, bodegaWasInventory, newImpression;

  beforeAll(async() => {
    category1 = await createCategory(prisma);
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bodegaWas = await createBookstore(prisma, {name: "WAS Editorial"});
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 2000, current: 3000});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is a note", dateStr: '2025-11-04'})

    mockReq = {
      params: {
        id: newImpression.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a status 200`, async() => {
    await deleteImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should mark the impression as deleted in the database`, async() => {
    updatedImpression = mockRes.json.mock.calls[0][0]
    expect(updatedImpression).toBeTruthy();
    expect(updatedImpression.isDeleted).toBe(true);
  })
})


describe(`deleting an impression with not enough copies available in WAS`, async() => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let impression;
  let impression2;
  let bookstore;
  let bookstore2;
  let inventory;
  let inventory2;
  let transfer;
  let payment;
  let sale;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    impression = await createImpression(prisma, book.id, {quantity: 500})
    impression2 = await createImpression(prisma, book.id, {quantity: 500})
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    transfer = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 400})
    payment = await createPayment(prisma, author.id, "2026-03")
    sale = await createSale(prisma, inventory.id, [payment.id], {quantity: 500})

    mockReq = {
      params: {
        id: impression.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    // 2 impression of 500 each
    // 1000 inicially in WAS inventory
    // 600 left after a transfer of 400 to inventory2
    // 100 left after a sale of 500
    // inventory has 100 disponibles
    // inventory2 has 400 disponibles
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return status 400`, async() => {
    await deleteImpression(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(jsonResponse).toStrictEqual({message: "La cantidad de libros imprimidos en esta impresión es superior a la que queda disponible en el inventario de WAS de este libro."})
  })

  it(`should not mark the impression as deleted`, async() => {
    const notDeletedImpression = await prisma.impression.findUnique({where: {id: impression.id}})
    expect(notDeletedImpression.isDeleted).toBe(false)
  })
})