import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  deleteSendToAuthor,
  deleteReturnToLibrary,
  deleteSendToLibrary,
  deleteReturnFromAuthor,
  deleteTransfer
} from "../../../routes/admin/transfers/deleteTransfer.js";
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
  createTestDB,
  dropTestDB,
  createTransfer,
  truncateAll,
} from "../../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import { json, text } from "node:stream/consumers";
import { after } from "node:test";

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() =>  {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



describe("deleteSendToAuthor - happy path",() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});

    res = await deleteSendToAuthor(prisma, send)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 with message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deletedTransfer = await prisma.transfer.findUnique({where: {id: send.id}})
    expect(deletedTransfer.isDeleted).toBe(true)
  })
})



describe("deleteSendToAuthor - no transfer to be deleted",() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should throw", async() => {
    await expect(deleteSendToAuthor(prisma)).rejects.toThrow("No transfer to be deleted was provided")
  })

  it("should not mark the transfer as deleted in the db", async() => {
    const notDeleted = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(notDeleted.isDeleted).toBe(false)
  })
})



describe("deleteSendToAuthor - remaning returns from author", () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory.id, quantity: 5})

    res = await deleteSendToAuthor(prisma, send);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `Quedan devoluciones de autor vinculadas a esta entrega al autor. Por favor elimine las devoluciones primero.`
    })
  })

  it("should not mark the transfer as deleted in the db", async() => {
    const notDeleted = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(notDeleted.isDeleted).toBe(false)
  })
})



describe("deleteSendToAuthor - enough remaning returns from author to delete", () => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send, send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    send2 = await createTransfer(prisma, inventory.id, {quantity: 10});
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory.id, quantity: 5})

    res = await deleteSendToAuthor(prisma, send);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deleted = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(deleted.isDeleted).toBe(true)
  })
})



describe("deleteReturnFromAuthor - happy path", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory.id, quantity: 5})

    res = await deleteReturnFromAuthor(prisma, returnFromAuthor);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deletedTransfer = await prisma.transfer.findUnique({
      where: {
        id: returnFromAuthor.id
      }
    })
    expect(deletedTransfer.isDeleted).toBe(true)
  })
})



describe("deleteReturnFromAuthor - no transfer to be deleted", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore;
  let inventory;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory.id, quantity: 5})
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should throw", async() => {
    await expect(deleteReturnFromAuthor(prisma)).rejects.toThrow("No transfer to be deleted was provided")
  })

  it("should not mark the transfer as deleted in the db", async() => {
    const notDeleted = await prisma.transfer.findUnique({
      where: {
        id: returnFromAuthor.id
      }
    })
    expect(notDeleted.isDeleted).toBe(false)
  })
})



describe("deleteSendToLibrary - happy path", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});

    res = await deleteSendToLibrary(prisma, send);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deletedTransfer = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(deletedTransfer.isDeleted).toBe(true)
  })
})



describe("deleteSendToLibrary - remaining returns", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})
    
    res = await deleteSendToLibrary(prisma, send);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and message", async() => {
    const inventoryFull = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        },
        bookstore: true,
        sales: true,
        transfersFrom: true,
        transfersTo: true
      }
    })
    const derived = getInventoryDerived(inventoryFull)
    expect(res).toStrictEqual({
      status: 400,
      message: `No quedan suficiente libros en este inventario (${derived.disponibles}) para poder eliminar este ingreso (${send.quantity})`
    })
  })

  it("should not mark the transfer as deleted in the db", async() => {
    const notDeleted = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(notDeleted.isDeleted).toBe(false)
  })
})



describe("deleteSendToLibrary - enough remaining send to delete", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send, send2;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    send2 = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})
    
    res = await deleteSendToLibrary(prisma, send);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deletedTransfer = await prisma.transfer.findUnique({
      where: {
        id: send.id
      }
    })
    expect(deletedTransfer.isDeleted).toBe(true)
  })
})



describe("deleteReturnToLibrary - happy path", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})
    
    res = await deleteReturnToLibrary(prisma, devolucion);
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and message", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Movimiento eliminado con exito."
    })
  })

  it("should mark the transfer as deleted in the db", async() => {
    const deletedTransfer = await prisma.transfer.findUnique({
      where: {
        id: devolucion.id
      }
    })
    expect(deletedTransfer.isDeleted).toBe(true)
  })
})



describe("deleteReturnToLibrary - missing transfer", async() => {
  let res;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should throw", async() => {
    await expect(deleteReturnToLibrary(prisma)).rejects.toThrow("No transfer to be deleted was provided")
  })

  it("should not mark the transfer as deleted in the db", async() => {
    const notDeleted = await prisma.transfer.findUnique({
      where: {
        id: devolucion.id
      }
    })
    expect(notDeleted.isDeleted).toBe(false)
  })
})



describe("deleteTransfer - send to library - transferToBeDeleted is deleted", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10, isDeleted: true});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: send.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return a failure message", async() => {
    expect(jsonResponse).toStrictEqual({error: 'A server error occurred while deleting the transfer'})
  })
})



describe("deleteTransfer - send to library - transferToBeDeleted doesn't exist", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10, isDeleted: true});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: 1957
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return a failure message", async() => {
    expect(jsonResponse).toStrictEqual({error: 'A server error occurred while deleting the transfer'})
  })
})



describe("deleteTransfer - send to library - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    // devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: send.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Movimiento eliminado con exito."})
  })
})



describe("deleteTransfer - return to library - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 10});
    devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: devolucion.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Movimiento eliminado con exito."})
  })
})



describe("deleteTransfer - send to author - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    // devolucion = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: send.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Movimiento eliminado con exito."})
  })
})



describe("deleteTransfer - return from author - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let devolucion;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id);
    send = await createTransfer(prisma, inventory.id, {quantity: 10});
    devolucion = await createTransfer(prisma, null, {toInventoryId: inventory.id, quantity: 5})

    mockReq = {
      params: {
        id: devolucion.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await deleteTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Movimiento eliminado con exito."})
  })
})