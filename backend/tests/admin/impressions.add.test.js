import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addImpression } from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
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
let newBook, newBook2;
let bodegaWasBookstore;
let bodegaWasInventory, inventory2;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  newAuthor = await createAuthor(prisma);
  newBook = await createBook(prisma, [newAuthor.id]);
  newBook2 = await createBook(prisma, [newAuthor.id]);
  bodegaWasBookstore = await createBookstore(prisma, {name: "Plataforma Was"});
  bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 1000, current:500});
  inventory2 = await createInventory(prisma, newBook2.id, 1, {initial: 1000, current:500});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



//ADDING
describe(`adding an impression with valid parameters`, async() => {
  let newImpression;
  let mockReq, mockRes;

  beforeAll(async() => {
    mockReq = {
      body: {
        quantity: 1000, 
        id: newBook.id,
        note: "this is a note",
        date: new Date("2025-11-04")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 201`, async() => {
    await addImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201)
  })

  it(`should create a new impression in the database with the correct data`, async() => {
    newImpression = mockRes.json.mock.calls[0][0]
    expect(newImpression).toBeTruthy()
    expect(newImpression.quantity).toBe(1000)
    expect(newImpression.bookId).toBe(newBook.id)
    expect(newImpression.note).toBe("this is a note")
    expect(newImpression.date).toStrictEqual(new Date("2025-11-04"))
  })

  it(`should update the Bodega Was inventory for this book`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: bodegaWasInventory.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(1500);
  })
})



describe(`adding an impression with invalid parameters`, async() => {
  let newImpression;
  let mockReq, mockRes, mute;

  beforeAll(async() => {
    mockReq = {
      body: {
        quantity: "mil", 
        id: newBook2.id,
        note: 2908,
        date: new Date("2026-11-04")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => { mute.mockRestore() })

  it(`should return a status 500`, async() => {
    await addImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not create a new impression in the database`, async() => {
    newImpression = mockRes.json.mock.calls[0][0]
    expect(newImpression).toStrictEqual({error: "A server error occurred while creating the impression"})
  })

  it(`should not update the Bodega Was inventory for this book`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(500);
  })
})