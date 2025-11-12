import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addImpression, updateImpression, deleteImpression } from "../../routes/adminRoutes.js";
import { prisma } from "../../prisma/client.js";
import {
  createAuthor,
  createBook,
  createInventory,
  createImpression,
  deleteFromDB 
} from "../../testUtils.js";

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

describe(`adding an impression with invalid parameters`, async() => {
  let newAuthor, newBook, bodegaWasInventory, newImpression;
  let mockReq, mockRes;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}]);
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);

    mockReq = {
      body: {
        quantity: "mil", 
        id: newBook.id,
        note: 2908,
        date: new Date("2026-11-04")
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, bodegaWasInventory, "inventory");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

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
        id: bodegaWasInventory.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(500);
  })
})


///UPDATING
describe(`updating an impression with valid parameters`, async() => {
  let newAuthor, newBook, bodegaWasInventory, newImpression;
  let mockReq, mockRes;
  let updatedImpression;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}]);
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, 2000, 3000, false, 0, 0);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is a note", date: new Date('2025-11-04')})

    mockReq = {
      params: {
        id: newImpression.id
      },
      body: {
        quantity: 500, 
        book_id: newBook.id,
        note: "this is an updated note",
        date: new Date("2025-11-01")
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

  it(`should return a status 200`, async() => {
    await updateImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should update the impression with the correct data in the database`, async() => {
    updatedImpression = mockRes.json.mock.calls[0][0]
    expect(updatedImpression).toBeTruthy();
    expect(updatedImpression.quantity).toBe(500);
    expect(updatedImpression.note).toBe("this is an updated note");
    expect(updatedImpression.date).toStrictEqual(new Date("2025-11-01"));
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
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(2500);
  })
})

describe(`updating an impression with invalid parameters`, async() => {
  let newAuthor, newBook, bodegaWasInventory, newImpression;
  let mockReq, mockRes;
  let updatedImpression;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}]);
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, 2000, 3000, false, 0, 0);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is a note", date: new Date('2025-11-04')})

    mockReq = {
      params: {
        id: newImpression.id
      },
      body: {
        quantity: "quinientos", 
        book_id: newBook.id,
        note: 25301,
        date: new Date("2026-11-01")
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

  it(`should return a status 500`, async() => {
    await updateImpression(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the impression with the correct data in the database`, async() => {
    const jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "A server error occurred while creating the impression"});
    const updatedImpression = await prisma.impression.findUnique({where: {id: newImpression.id}});
    expect(updatedImpression.quantity).toBe(1000);
    expect(updatedImpression.note).toBe("this is a note");
    expect(updatedImpression.date).toStrictEqual(new Date("2025-11-04"))
  })

  it(`should not update the inventory tied to the impression`, async() => {
    const updatedWasInventory = await prisma.inventory.findUnique({
      where: {
        id: bodegaWasInventory.id
      },
      include: {
        bookstore: true
      }
    })
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(3000);
  })
})


//DELETING
describe(`deleting an impression with valid parameters`, async() => {
  let newAuthor, newBook, bodegaWasInventory, newImpression;
  let mockReq, mockRes;
  let updatedImpression;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}]);
    bodegaWasInventory = await createInventory(prisma, newBook.id, 1, 2000, 3000, false, 0, 0);
    newImpression = await createImpression(prisma, newBook.id, 1000, {note: "this is a note", date: new Date('2025-11-04')})

    mockReq = {
      params: {
        id: newImpression.id
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
    expect(updatedWasInventory.bookstore.name).toBe("Plataforma Was");
    expect(updatedWasInventory.current).toBe(2000);
  })
})