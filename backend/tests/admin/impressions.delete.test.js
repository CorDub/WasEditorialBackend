import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteImpression } from "../../routes/adminRoutes.js";
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
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;
let newAuthor;
let newBook;
let bodegaWas;
let bodegaWasInventory;
let newImpression;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  newAuthor = await createAuthor(prisma);
  newBook = await createBook(prisma, [newAuthor.id]);
  bodegaWas = await createBookstore(prisma, {name: "WAS Editorial"});
  bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 2000, current: 3000});
  newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is a note", date: new Date('2025-11-04')})
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



//DELETING
describe(`deleting an impression with valid parameters`, async() => {
  let mockReq, mockRes;
  let updatedImpression;

  beforeAll(async() => {
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

  it(`should return a status 200`, async() => {
    await deleteImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should mark the impression as deleted in the database`, async() => {
    updatedImpression = mockRes.json.mock.calls[0][0]
    expect(updatedImpression).toBeTruthy();
    expect(updatedImpression.isDeleted).toBe(true);
  })

  it(`should update the inventory tied to the impression`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: bodegaWasInventory.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("WAS Editorial");
    expect(updatedWasInventory.current).toBe(2000);
  })
})
