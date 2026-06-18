import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  editReturnToLibrary,
  editSendToLibrary,
  editSendToAuthor,
  editReturnFromAuthor,
  updateTransfer
} from "../../../routes/admin/transfers/updateTransfer.js";
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
import { text } from "node:stream/consumers";

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



describe("editSendToLibrary - happy path", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity:10, dateStr:"2026-06-15"})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 15,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Ingreso a librería editado con exito."
    })
  })

  it("should edit the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("editSendToLibrary - not enough disponibles downstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 3,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de destinación para hacer este cambio.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEdited = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEdited.quantity).toBe(send.quantity)
    expect(notEdited.dateStr).toBe(send.dateStr)
  })
})



describe("editSendToLibrary - not enough copias upstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 20,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No hay suficientes libros imprimidos para hacer este ingreso a otra librería.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEdited = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEdited.quantity).toBe(send.quantity)
    expect(notEdited.dateStr).toBe(send.dateStr)
  })
})



describe("editSendToLibrary - not enough disponibles upstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let payment;
  let sale;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    payment = await createPayment(prisma, author.id, "2026-06")
    sale = await createSale(prisma, inventory1.id, [payment.id], {quantity: 5})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 13,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de salida para hacer este cambio.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEdited = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEdited.quantity).toBe(send.quantity)
    expect(notEdited.dateStr).toBe(send.dateStr)
  })
})



describe("editSendToLibrary - wrong order", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 13,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-17"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede poner un ingreso a librería después de sus devoluciones.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEdited = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEdited.quantity).toBe(send.quantity)
    expect(notEdited.dateStr).toBe(send.dateStr)
  })
})



describe("editSendToLibrary - equality", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      inventoryToId: inventory2.id,
      quantity: 13,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Ingreso a librería editado con exito."
    })
  })

  it("should edit the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("editReturnToLibrary - happy path", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnToLibrary.id,
      inventoryToId: inventory1.id,
      quantity: 7,
      inventoryFromId: inventory2.id,
      type: "return",
      dateStrOptional: "2026-06-17"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Devolución a librería editada con exito."
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("editReturnToLibrary - not enough disponibles upstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnToLibrary.id,
      inventoryToId: inventory1.id,
      quantity: 11,
      inventoryFromId: inventory2.id,
      type: "return",
      dateStrOptional: "2026-06-17"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de salida para hacer este cambio.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(returnToLibrary.quantity)
    expect(notEditedTransfer.dateStr).toBe(returnToLibrary.dateStr)
  })
})



describe("editReturnToLibrary - wrong order", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnToLibrary.id,
      inventoryToId: inventory1.id,
      quantity: 7,
      inventoryFromId: inventory2.id,
      type: "return",
      dateStrOptional: "2026-06-14"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede poner una devolución antes de su ingreso a librería.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(returnToLibrary.quantity)
    expect(notEditedTransfer.dateStr).toBe(returnToLibrary.dateStr)
  })
})



describe("editReturnToLibrary - equality", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnToLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnToLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnToLibrary.id,
      inventoryToId: inventory1.id,
      quantity: 7,
      inventoryFromId: inventory2.id,
      type: "return",
      dateStrOptional: "2026-06-15"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnToLibrary(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Devolución a librería editada con exito."
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("editSendToAuthor - happy path", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      quantity: 7,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-14",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Entrega al autor editada con exito."
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
    expect(editedTransfer.note).toBe(inputs.note)
    expect(editedTransfer.place).toBe(inputs.place)
    expect(editedTransfer.person).toBe(inputs.person)
  })
})



describe("editSendToAuthor - not enough disponibles downstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      quantity: 4,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-14",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede tener menos entregas al autor que devoluciones del autor.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(send.quantity)
    expect(notEditedTransfer.dateStr).toBe(send.dateStr)
    expect(notEditedTransfer.note).toBe(send.note)
    expect(notEditedTransfer.place).toBe(send.place)
    expect(notEditedTransfer.person).toBe(send.person)
  })
})



describe("editSendToAuthor - not enough copias upstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      quantity: 20,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-14",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No hay suficientes libros imprimidos para hacer este entrega al autor.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(send.quantity)
    expect(notEditedTransfer.dateStr).toBe(send.dateStr)
    expect(notEditedTransfer.note).toBe(send.note)
    expect(notEditedTransfer.place).toBe(send.place)
    expect(notEditedTransfer.person).toBe(send.person)
  })
})



describe("editSendToAuthor - not enough disponibles upstream", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  // let returnFromAuthor;
  let payment;
  let sale;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    // returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})
    payment = await createPayment(prisma, author.id, "2026-06")
    sale = await createSale(prisma, inventory1.id, [payment.id], {quantity: 5})

    inputs = {
      id: send.id,
      quantity: 12,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-14",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario para hacer este cambio.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(send.quantity)
    expect(notEditedTransfer.dateStr).toBe(send.dateStr)
    expect(notEditedTransfer.note).toBe(send.note)
    expect(notEditedTransfer.place).toBe(send.place)
    expect(notEditedTransfer.person).toBe(send.person)
  })
})



describe("editSendToAuthor - wrong order", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      quantity: 12,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-17",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede poner una entrega del autor después de sus devoluciones.`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(send.quantity)
    expect(notEditedTransfer.dateStr).toBe(send.dateStr)
    expect(notEditedTransfer.note).toBe(send.note)
    expect(notEditedTransfer.place).toBe(send.place)
    expect(notEditedTransfer.person).toBe(send.person)
  })
})



describe("editSendToAuthor - equality", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: send.id,
      quantity: 12,
      inventoryFromId: inventory1.id,
      type: "send",
      dateStrOptional: "2026-06-16",
      note: "Done",
      place: "Salon del libro",
      person: "Juan"
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editSendToAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Entrega al autor editada con exito."
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
    expect(editedTransfer.note).toBe(inputs.note)
    expect(editedTransfer.place).toBe(inputs.place)
    expect(editedTransfer.person).toBe(inputs.person)
  })
})



describe("editReturnFromAuthor - happy path", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnFromAuthor.id,
      quantity: 7,
      toInventoryId: inventory1.id,
      type: "return",
      dateStrOptional: "2026-06-17",
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnFromAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Devolución del autor editada con exito"
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("editReturnFromAuthor - not enough upstream disponibles", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnFromAuthor.id,
      quantity: 11,
      toInventoryId: inventory1.id,
      type: "return",
      dateStrOptional: "2026-06-17",
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnFromAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede devolver mas libros que han estado entregados al autor`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(returnFromAuthor.quantity)
    expect(notEditedTransfer.dateStr).toBe(returnFromAuthor.dateStr)
  })
})



describe("editReturnFromAuthor - return before earliest delivery", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-16"})

    inputs = {
      id: returnFromAuthor.id,
      quantity: 7,
      toInventoryId: inventory1.id,
      type: "return",
      dateStrOptional: "2026-06-14",
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnFromAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede poner una devolución del autor antes de la primera entrega al autor del inventario`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(returnFromAuthor.quantity)
    expect(notEditedTransfer.dateStr).toBe(returnFromAuthor.dateStr)
  })
})



describe("editReturnFromAuthor - wrong order", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    send2 = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-17"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 15, dateStr:"2026-06-18"})

    inputs = {
      id: returnFromAuthor.id,
      quantity: 15,
      toInventoryId: inventory1.id,
      type: "return",
      dateStrOptional: "2026-06-16",
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnFromAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400 and failure message object", async() => {
    expect(res).toStrictEqual({
      status: 400,
      message: `No se puede poner una devolución del autor antes de que haya suficiente entregas al autor`
    })
  })

  it("should not update the transfer in the db", async() => {
    const notEditedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(notEditedTransfer.quantity).toBe(returnFromAuthor.quantity)
    expect(notEditedTransfer.dateStr).toBe(returnFromAuthor.dateStr)
  })
})



describe("editReturnFromAuthor - equality", () => {
  let res, inputs;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 15, dateStr:"2026-06-18"})

    inputs = {
      id: returnFromAuthor.id,
      quantity: 7,
      toInventoryId: inventory1.id,
      type: "return",
      dateStrOptional: "2026-06-15",
    }

    const transferToBeEdited = await prisma.transfer.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        toInventory: true,
        fromInventory: true
      }
    })

    res = await editReturnFromAuthor(prisma, transferToBeEdited, inputs)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200 and success message object", async() => {
    expect(res).toStrictEqual({
      status: 200,
      message: "Devolución del autor editada con exito"
    })
  })

  it("should update the transfer in the db", async() => {
    const editedTransfer = await prisma.transfer.findUnique({where: {id: inputs.id}})
    expect(editedTransfer.quantity).toBe(inputs.quantity)
    expect(editedTransfer.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe("updateTransfer - tansferToBeEdited doesn't exist", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 15, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: 1345
      },
      body: {
        quantity: 7,
        toInventoryId: inventory1.id,
        type: "return",
        dateStrOptional: "2026-06-15",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return an error message", async() => {
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while updating the transfer"})
  })
})



describe("updateTransfer - tansferToBeEdited is deleted", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 15, dateStr:"2026-06-18", isDeleted: true})

    mockReq = {
      params: {
        id: returnFromAuthor.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory1.id,
        type: "return",
        dateStrOptional: "2026-06-15",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return an error message", async() => {
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while updating the transfer"})
  })
})



describe("updateTransfer - transfer to author - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: send.id
      },
      body: {
        quantity: 7,
        inventoryFromId: inventory1.id,
        type: "send",
        dateStrOptional: "2026-06-16",
        note: "done",
        place: "salon del libro",
        person: "person"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Entrega al autor editada con exito."})
  })
})



describe("updateTransfer - return from author - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {quantity: 10, dateStr:"2026-06-15"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: returnFromAuthor.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory1.id,
        type: "return",
        dateStrOptional: "2026-06-16",
        note: "done",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Devolución del autor editada con exito"})
  })
})



describe("updateTransfer - send to library - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnFromLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: send.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory2.id,
        inventoryFromId: inventory1.id,
        type: "send",
        dateStrOptional: "2026-06-16",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Ingreso a librería editado con exito."})
  })
})



describe("updateTransfer - return from library - happy path", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send;
  let returnFromLibrary;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    returnFromLibrary = await createTransfer(prisma, inventory2.id, {toInventoryId: inventory1.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: returnFromLibrary.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory1.id,
        inventoryFromId: inventory2.id,
        type: "return",
        dateStrOptional: "2026-06-16",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Devolución a librería editada con exito."})
  })
})



describe("updateTransfer - send to author - other Was", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send, send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma, {wasRed: true});
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    send2 = await createTransfer(prisma, inventory2.id, {quantity: 8, dateStr:"2026-06-16"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: send2.id
      },
      body: {
        quantity: 7,
        inventoryFromId: inventory2.id,
        type: "send",
        dateStrOptional: "2026-06-16",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Entrega al autor editada con exito."})
  })
})



describe("updateTransfer - return from author - other Was", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send, send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma, {wasRed: true});
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    send2 = await createTransfer(prisma, inventory2.id, {quantity: 8, dateStr:"2026-06-16"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: returnFromAuthor.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory2.id,
        type: "return",
        dateStrOptional: "2026-06-17",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({message: "Devolución del autor editada con exito"})
  })
})



describe("updateTransfer - send to author - not Was", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send, send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    send2 = await createTransfer(prisma, inventory2.id, {quantity: 8, dateStr:"2026-06-16"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: send2.id
      },
      body: {
        quantity: 7,
        inventoryFromId: inventory2.id,
        type: "send",
        dateStrOptional: "2026-06-16",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while updating the transfer"})
  })
})



describe("updateTransfer - return from author - not Was", () => {
  let mockReq, mockRes, jsonResponse;
  let author;
  let category;
  let book;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let impression;
  let send, send2;
  let returnFromAuthor;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    category = await createCategory(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book.id, bookstore1.id);
    inventory2 = await createInventory(prisma, book.id, bookstore2.id);
    impression = await createImpression(prisma, book.id, {quantity : 15})
    send = await createTransfer(prisma, inventory1.id, {toInventoryId: inventory2.id, quantity: 10, dateStr:"2026-06-15"})
    send2 = await createTransfer(prisma, inventory2.id, {quantity: 8, dateStr:"2026-06-16"})
    returnFromAuthor = await createTransfer(prisma, null, {toInventoryId: inventory2.id, quantity: 5, dateStr:"2026-06-18"})

    mockReq = {
      params: {
        id: returnFromAuthor.id
      },
      body: {
        quantity: 7,
        toInventoryId: inventory2.id,
        type: "return",
        dateStrOptional: "2026-06-17",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await updateTransfer(mockReq, mockRes)
    jsonResponse = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return a success message", async() => {
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while updating the transfer"})
  })
})