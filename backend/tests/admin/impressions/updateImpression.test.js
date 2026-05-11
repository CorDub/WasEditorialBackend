import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateImpression } from "../../../routes/admin/impressions/updateImpression.js";
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


///UPDATING
describe(`updating an impression with valid parameters`, async() => {
  let mockReq, mockRes;
  let updatedImpression;
  let category1;
  let newAuthor;
  let newBook, newBook2;
  let bodegaWasBookstore;
  let bodegaWasInventory, inventory2;
  let newImpression, newImpression2;

  beforeAll(async() => {
    category1 = await createCategory(prisma);
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    bodegaWasBookstore = await createBookstore(prisma, {name: "WAS Editorial"});
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 2000, current:3000});
    inventory2 = await createInventory(prisma, newBook2.id, 1, {initial: 1000, current:500});
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

  afterAll(async() => {
    await truncateAll(prisma)
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
  let category1;
  let newAuthor;
  let newBook, newBook2;
  let bodegaWasBookstore;
  let bodegaWasInventory, inventory2;
  let newImpression, newImpression2;
  // let transfer;

  beforeAll(async() => {
    category1 = await createCategory(prisma);
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    newBook2 = await createBook(prisma, [newAuthor.id]);
    bodegaWasBookstore = await createBookstore(prisma, {name: "WAS Editorial"});
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, {initial: 2000, current:3000});
    inventory2 = await createInventory(prisma, newBook2.id, 1, {initial: 1000, current:500});
    newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is a note", dateStr: '2025-11-04'})
    newImpression2 = await createImpression(prisma, newBook2.id, {quantity: 500, note: "this is a note", dateStr: '2025-11-04'})

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
    await truncateAll(prisma)
  })

  it(`should return a status 500`, async() => {
    await updateImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the impression with the correct data in the database`, async() => {
    const jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "A server error occurred while creating the impression"});
    const updatedImpression = await prisma.impression.findUnique({where: {id: newImpression2.id}});
    expect(updatedImpression.quantity).toBe(500);
    expect(updatedImpression.note).toBe("this is a note");
    expect(updatedImpression.dateStr).toEqual("2025-11-04")
  })

  it(`should not update the inventory tied to the impression`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        bookstore: true,
        book: {
          include: {
            impressions: true
          }
        },
        sales: true,
        transfersFrom: true,
        transfersTo: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("WAS Editorial");
    const updatedWasInventoryDerived = getInventoryDerived(updatedWasInventory)
    expect(updatedWasInventoryDerived.disponibles).toBe(500);
  })
})


describe(`updating an impression without sufficient books in the WAS inventory`, async() => {
  let mockReq, mockRes, jsonResponse, mute;
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

    // 2 impression of 500 each
    // 1000 inicially in WAS inventory
    // 600 left after a transfer of 400 to inventory2
    // 100 left after a sale of 500
    // inventory has 100 disponibles
    // inventory2 has 400 disponibles

    mockReq = {
      params: {
        id: impression.id
      },
      body: {
        quantity: 200,
        book_id: book.id,
        note: "",
        dateStr: "2026-03-24"
      },
      prisma : prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    // mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    // mute.mockRestore()
    await truncateAll(prisma)
  })

  it(`should return a 400`, async() => {
    await updateImpression(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0];
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(jsonResponse).toStrictEqual({message:"No se puede reducir la cantidad de libros imprimidos a menos de lo que queda disponible en el inventario de WAS de este libro."})
  })

  it(`should not update the impression`, async() => {
    const notUpdatedImpression = await prisma.impression.findUnique({where: {id: impression.id}})
    expect(notUpdatedImpression.quantity).toBe(500)
  })
})
