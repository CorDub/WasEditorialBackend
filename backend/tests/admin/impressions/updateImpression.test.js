import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateImpression } from "../../../routes/admin/impressions/updateImpression.js";
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
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;
let newAuthor;
let newBook, newBook2;
let bodegaWasBookstore;
let bodegaWasInventory, inventory2;
let newImpression, newImpression2;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  newAuthor = await createAuthor(prisma);
  newBook = await createBook(prisma, [newAuthor.id]);
  newBook2 = await createBook(prisma, [newAuthor.id]);
  bodegaWasBookstore = await createBookstore(prisma, {name: "WAS Editorial"});
  bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 2000, current:3000});
  inventory2 = await createInventory(prisma, newBook2.id, 1, {initial: 1000, current:500});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


///UPDATING
describe(`updating an impression with valid parameters`, async() => {
  let mockReq, mockRes;
  let updatedImpression;

  beforeAll(async() => {
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is a note", dateStr: '2025-11-04'})

    mockReq = {
      params: {
        id: newImpression.id
      },
      body: {
        quantity: 500,
        book_id: newBook.id,
        note: "this is an updated note",
        dateStr: "2025-11-01"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await updateImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should update the impression with the correct data in the database`, async() => {
    updatedImpression = mockRes.json.mock.calls[0][0]
    expect(updatedImpression).toBeTruthy();
    expect(updatedImpression.quantity).toBe(500);
    expect(updatedImpression.note).toBe("this is an updated note");
    expect(updatedImpression.dateStr).toEqual("2025-11-01");
  })

  // it(`should update the inventory tied to the impression`, async() => {
  //   const updatedWasInventory = await prisma.inventory.findUnique({
  //     where: {
  //       id: bodegaWasInventory.id
  //     },
  //     include: {
  //       bookstore: true
  //     }
  //   })
  //   expect(updatedWasInventory.bookstore.name).toBe("WAS Editorial");
  //   expect(updatedWasInventory.current).toBe(2500);
  // })
})



describe(`updating an impression with invalid parameters`, async() => {
  let mockReq, mockRes, mute;
  let updatedImpression;

  beforeAll(async() => {
    newImpression2 = await createImpression(prisma, newBook2.id, {quantity: 1000, note: "this is a note", dateStr: '2025-11-04'})

    mockReq = {
      params: {
        id: newImpression.id
      },
      body: {
        quantity: "quinientos",
        book_id: newBook.id,
        note: 25301,
        dateStr: "2026-11-01"
      },
      prisma : prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await updateImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the impression with the correct data in the database`, async() => {
    const jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "A server error occurred while creating the impression"});
    const updatedImpression = await prisma.impression.findUnique({where: {id: newImpression2.id}});
    expect(updatedImpression.quantity).toBe(1000);
    expect(updatedImpression.note).toBe("this is a note");
    expect(updatedImpression.dateStr).toEqual("2025-11-04")
  })

  it(`should not update the inventory tied to the impression`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("WAS Editorial");
    expect(updatedWasInventory.current).toBe(500);
  })
})
