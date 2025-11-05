import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addImpression, updateImpression, deleteImpression } from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import {
  getForMonth,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createImpression,
  deleteFromDB, 
  validateInputs
} from "../utils.js"

//ADDING
describe(`adding an impression with valid parameters`, async() => {
  let newAuthor, newBook, bodegaWasInventory, newImpression;
  let mockReq, mockRes;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}]);
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);

    mockReq = {
      body: {
        quantity: 1000, 
        id: newBook.id,
        note: "this is a note",
        date: new Date("2025-11-04")
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newImpression, "impression");
    await deleteFromDB(prisma, bodegaWasInventory, "inventory");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
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