import {describe, expect, vi, it, beforeAll, afterAll} from "vitest";
import { getForMonth } from "../../../utils.js";
import { 
  getInventoryTo,
  addDeliveryToBookstore,
  addReturn,
  addDeliveryToAuthor,
  addTransfer,
  addReturnFromAuthor,
} from "../../../routes/admin/transfers/addTransfer.js";
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


describe(`getInventoryTo happy path`, async() => {
  let res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: bookstore2.id
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should return an inventory object with id key`, async() => {
    res = await getInventoryTo(prisma, inventory, inputs)
    expect(res).toHaveProperty("id")
  })

  it(`should return the correct inventory`, async() => {
    expect(res.id).toBe(inventory2.id)
  })
})


describe(`getInventoryTo doesn't exist`, async() => {
  let res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id, {price: 400})
    inputs = {
      bookstoreToId: bookstore2.id
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should return an inventory object with id key`, async() => {
    res = await getInventoryTo(prisma, inventory, inputs)
    expect(res).toHaveProperty("id")
  })

  it(`should return the correct inventory`, async() => {
    expect(res.id).toBe(2)
  })

  it(`the price in the new inventory should be the same that departing one`, async() => {
    expect(res.price).toBe(400)
  })
})


describe(`getInventoryTo deleted`, async() => {
  let res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id, {price: 400})
    inventory2 = await createInventory(prisma, book.id, bookstore2.id, {isDeleted: true})
    inputs = {
      bookstoreToId: bookstore2.id
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should return an inventory object with id key`, async() => {
    res = await getInventoryTo(prisma, inventory, inputs)
    expect(res).toHaveProperty("id")
  })

  it(`should return the correct inventory`, async() => {
    expect(res.id).toBe(2)
  })

  it(`should recover the deleted inventory`, async() => {
    expect(res.isDeleted).toBe(false)
  })

  it(`should be the same price in departing and recovered inventories`, async() => {
    expect(res.price).toBe(400)
  })
})


describe(`addDeliveryToBookstore happy path`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: bookstore2.id,
      inventoryFromId: inventory.id,
      quantity: 100,
      type: "send",
      dateStrOptional: "2026-03-10"
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should send status 200`, async() => {
    await addDeliveryToBookstore(prisma, inventory, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a transfer object with 15 keys`, async() => {
    expect(Object.keys(res)).toHaveLength(13)
    expect(res).toHaveProperty("id")
    expect(res).toHaveProperty("fromInventoryId")
    expect(res).toHaveProperty("toInventoryId")
    expect(res).toHaveProperty("quantity")
    expect(res).toHaveProperty("type")
    expect(res).toHaveProperty("note")
    expect(res).toHaveProperty("deliveryDate")
    expect(res).toHaveProperty("dateStr")
    expect(res).toHaveProperty("place")
    expect(res).toHaveProperty("person")
    expect(res).toHaveProperty("isDeleted")
    expect(res).toHaveProperty("createdAt")
    expect(res).toHaveProperty("updatedAt")
  })

  it(`should return the correct transfer`, async() => {
    expect(res.fromInventoryId).toBe(inputs.inventoryFromId)
    expect(res.toInventoryId).toBe(inventory2.id)
    expect(res.quantity).toBe(100)
    expect(res.type).toBe("send")
    expect(res.dateStr).toBe(inputs.dateStrOptional)
  })
})


describe(`addDeliveryToBookstore wrong bookstore Id`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: bookstore2.id,
      inventoryFromId: inventory.id,
      quantity: 100,
      type: "send",
      dateStrOptional: "2026-03-10"
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should throw an error`, async() => {
    await expect(() => addDeliveryToBookstore(prisma, inventory2, inputs, mockRes))
      .rejects.toThrow("bookstoreId can't be other than 1 for a delivery to other bookstores")
  })
})


describe(`addReturn happy path`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: bookstore.id,
      inventoryFromId: inventory2.id,
      quantity: 100,
      type: "return",
      dateStrOptional: "2026-03-10"
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should send status 200`, async() => {
    await addReturn(prisma, inventory2, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a transfer object with 15 keys`, async() => {
    expect(Object.keys(res)).toHaveLength(13)
    expect(res).toHaveProperty("id")
    expect(res).toHaveProperty("fromInventoryId")
    expect(res).toHaveProperty("toInventoryId")
    expect(res).toHaveProperty("quantity")
    expect(res).toHaveProperty("type")
    expect(res).toHaveProperty("note")
    expect(res).toHaveProperty("deliveryDate")
    expect(res).toHaveProperty("dateStr")
    expect(res).toHaveProperty("place")
    expect(res).toHaveProperty("person")
    expect(res).toHaveProperty("isDeleted")
    expect(res).toHaveProperty("createdAt")
    expect(res).toHaveProperty("updatedAt")
  })

  it(`should return the correct transfer`, async() => {
    expect(res.fromInventoryId).toBe(inputs.inventoryFromId)
    expect(res.toInventoryId).toBe(inventory.id)
    expect(res.quantity).toBe(100)
    expect(res.type).toBe("return")
    expect(res.dateStr).toBe(inputs.dateStrOptional)
  })
})


describe(`addReturn wrong bookstore Id`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: bookstore2.id,
      inventoryFromId: inventory.id,
      quantity: 100,
      type: "send",
      dateStrOptional: "2026-03-10"
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should throw an error`, async() => {
    await expect(() => addReturn(prisma, inventory, inputs, mockRes))
      .rejects.toThrow("bookstoreId can't be 1 for a return")
  })
})


describe(`addDeliveryToAuthor happy path`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2, inventoryFrom;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: null,
      inventoryFromId: inventory.id,
      quantity: 100,
      type: "send",
      dateStrOptional: "2026-03-10",
      place: "Salon del libro",
      person: "Juan",
      wasRed: true
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    inventoryFrom = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      },
      include: {
        bookstore: true
      }
    })
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should send status 200`, async() => {
    await addDeliveryToAuthor(prisma, inventoryFrom, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a transfer object with 13 keys`, async() => {
    expect(Object.keys(res)).toHaveLength(13)
    expect(res).toHaveProperty("id")
    expect(res).toHaveProperty("fromInventoryId")
    expect(res).toHaveProperty("toInventoryId")
    expect(res).toHaveProperty("quantity")
    expect(res).toHaveProperty("type")
    expect(res).toHaveProperty("note")
    expect(res).toHaveProperty("deliveryDate")
    expect(res).toHaveProperty("dateStr")
    expect(res).toHaveProperty("place")
    expect(res).toHaveProperty("person")
    expect(res).toHaveProperty("isDeleted")
    expect(res).toHaveProperty("createdAt")
    expect(res).toHaveProperty("updatedAt")
  })

  it(`should return the correct transfer`, async() => {
    expect(res.fromInventoryId).toBe(inputs.inventoryFromId)
    expect(res.toInventoryId).toBe(null)
    expect(res.quantity).toBe(100)
    expect(res.type).toBe("send")
    expect(res.dateStr).toBe(inputs.dateStrOptional)
    expect(res.place).toBe(inputs.place)
    expect(res.person).toBe(inputs.person)
  })
})



describe(`addDeliveryToAuthor - not wasRed or bookstoreId = 1`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2, inventoryFrom;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    inputs = {
      bookstoreToId: null,
      inventoryFromId: inventory2.id,
      quantity: 100,
      type: "send",
      dateStrOptional: "2026-03-10",
      place: "Salon del libro",
      person: "Juan",
      wasRed: false
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    inventoryFrom = await prisma.inventory.findUnique({
      where: {
        id: inventory2.id
      },
      include: {
        bookstore: true
      }
    })
  })

  afterAll(async() => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User",
        "Inventory",
        "Transfer",
        "Sale",
        "Book",
        "Bookstore",
        "Category",
        "KindleSale",
        "Impression",
        "Payment",
        "Cost"
      RESTART IDENTITY CASCADE;
    `)
  })

  it(`should send status 400`, async() => {
    await addDeliveryToAuthor(prisma, inventoryFrom, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400);
  })

  it(`should return an error message`, async() => {
    expect(res).toStrictEqual({message: "Entregas a autores solo se pueden hacer desde un inventario Was"})
  })
})



describe(`addReturnFromAuthor - happy path`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory.id, {quantity: 200})

    inputs = {
      bookstoreToId: bookstore.id,
      bookId: book.id,
      inventoryFromId: null,
      quantity: 100,
      type: "return",
      dateStrOptional: "2026-03-10",
      place: "Salon del libro",
      person: "Juan",
      note: "couldn't sell them",
      wasRed: true
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addReturnFromAuthor(prisma, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it('should return a 200', async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return the correct toInventoryId", async() => {
    const returnInv = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: inputs.bookId,
          bookstoreId: inputs.bookstoreToId,
        }
      }
    });
    expect(res.toInventoryId).toBe(returnInv.id)
  })

  it("should return the correct quantity", async() => {
    expect(res.quantity).toBe(inputs.quantity)
  })

  it("should return the correct type", async() => {
    expect(res.type).toBe(inputs.type)
  })

  it("should return the correct note", async() => {
    expect(res.note).toBe(inputs.note)
  })

  it("should return the correct dateStr", async() => {
    expect(res.dateStr).toBe(inputs.dateStrOptional)
  })
})



describe(`addReturnFromAuthor - no previous send`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)

    inputs = {
      bookstoreToId: bookstore.id,
      bookId: book.id,
      inventoryFromId: null,
      quantity: 100,
      type: "return",
      dateStrOptional: "2026-03-10",
      place: "Salon del libro",
      person: "Juan",
      note: "couldn't sell them",
      wasRed: true
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addReturnFromAuthor(prisma, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it('should return a 400', async() => {
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it('should return a failure message', async() => {
    expect(res).toStrictEqual({message: "No se puede devolver mas libros que han estado entregados al autor."})
  })
})



describe(`addReturnFromAuthor - previous send insufficient`, async() => {
  let mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory.id, {quantity: 200})

    inputs = {
      bookstoreToId: bookstore.id,
      bookId: book.id,
      inventoryFromId: null,
      quantity: 300,
      type: "return",
      dateStrOptional: "2026-03-10",
      place: "Salon del libro",
      person: "Juan",
      note: "couldn't sell them",
      wasRed: true
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addReturnFromAuthor(prisma, inputs, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it('should return a 400', async() => {
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it('should return a failure message', async() => {
    expect(res).toStrictEqual({message: "No se puede devolver mas libros que han estado entregados al autor."})
  })
})



describe(`addTransfer - send - happy path`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)

    mockReq = {
      body: {
        bookstoreToId: bookstore2.id,
        inventoryFromId: inventory.id,
        quantity: 100,
        type: "send",
        dateStr: "2026-03-10",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return the correct fromInventoryId", async() => {
    expect(res.fromInventoryId).toBe(inventory.id)
  })

  it("should return the correct toInventoryId", async() => {
    const toInventory = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: book.id,
          bookstoreId: bookstore2.id
        }
      }
    })
    expect(res.toInventoryId).toBe(toInventory.id)
  })

  it("should return the correct quantity", async() => {
    expect(res.quantity).toBe(100)
  })

  it("should return the correct type", async() => {
    expect(res.type).toBe("send")
  })

  it("should return the correct dateStr", async() => {
    expect(res.dateStr).toBe("2026-03-10")
  })
})



describe(`addTransfer - inventoryFrom is deleted`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id, {isDeleted: true})
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)

    mockReq = {
      body: {
        bookstoreToId: bookstore2.id,
        inventoryFromId: inventory.id,
        quantity: 100,
        type: "send",
        dateStr: "2026-03-10",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 500", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("should return a failure error", async() => {
    expect(res).toStrictEqual({error: "a server error occurred while creating the transfer"})
  })
})



describe(`addTransfer - not enough disponibles`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id, {quantity: 50})

    mockReq = {
      body: {
        bookstoreToId: bookstore2.id,
        inventoryFromId: inventory.id,
        quantity: 100,
        type: "send",
        dateStr: "2026-03-10",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 400", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("should return a failure error", async() => {
    const fullInventory = await prisma.inventory.findUnique({
      where: {
        id: inventory.id
      },
      include: {
        book: {
          include: {
            impressions: true
          }
        },
        bookstore: true,
        transfersFrom: true,
        transfersTo: true,
        sales: true
      }
    })
    const derived = getInventoryDerived(fullInventory)
    expect(res).toStrictEqual({message: `No hay sufficientes libros en el inventario. Libros disponibles: ${derived.disponibles}`})
  })
})



describe(`addTransfer - return - happy path`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory.id, {toInventoryId: inventory2.id, quantity: 200})

    mockReq = {
      body: {
        bookstoreToId: bookstore.id,
        inventoryFromId: inventory2.id,
        quantity: 100,
        type: "return",
        dateStr: "2026-03-10",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return the correct fromInventoryId", async() => {
    expect(res.fromInventoryId).toBe(inventory2.id)
  })

  it("should return the correct toInventoryId", async() => {
    const toInventory = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: book.id,
          bookstoreId: bookstore.id
        }
      }
    })
    expect(res.toInventoryId).toBe(toInventory.id)
  })

  it("should return the correct quantity", async() => {
    expect(res.quantity).toBe(100)
  })

  it("should return the correct type", async() => {
    expect(res.type).toBe("return")
  })

  it("should return the correct dateStr", async() => {
    expect(res.dateStr).toBe("2026-03-10")
  })
})



describe(`addTransfer - deliveryToAuthor - happy path`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)

    mockReq = {
      body: {
        inventoryFromId: inventory.id,
        quantity: 100,
        type: "send",
        dateStr: "2026-03-10",
        place: "Salon del libro",
        person: "Juan",
        note: "done",
        wasRed: true
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return the correct fromInventoryId", async() => {
    expect(res.fromInventoryId).toBe(inventory.id)
  })

  it("should return the correct toInventoryId", async() => {
    expect(res.toInventoryId).toBe(null)
  })

  it("should return the correct quantity", async() => {
    expect(res.quantity).toBe(100)
  })

  it("should return the correct note", async() => {
    expect(res.note).toBe("done")
  })

  it("should return the correct place", async() => {
    expect(res.place).toBe("Salon del libro")
  })

  it("should return the correct person", async() => {
    expect(res.person).toBe("Juan")
  })

  it("should return the correct dateStr", async() => {
    expect(res.dateStr).toBe("2026-03-10")
  })
})


describe(`addTransfer - returnFromAuthor - happy path`, () => {
  let mockReq, mockRes, res;
  let author;
  let book;
  let category;
  let bookstore, bookstore2;
  let inventory, inventory2;
  let impression;
  let send;
  let inputs;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    category = await createCategory(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma, {wasRed: true})
    bookstore2 = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    inventory2 = await createInventory(prisma, book.id, bookstore2.id)
    impression = await createImpression(prisma, book.id)
    send = await createTransfer(prisma, inventory.id, {quantity: 200})

    mockReq = {
      body: {
        bookId: book.id,
        bookstoreToId: bookstore.id,
        quantity: 100,
        type: "return",
        dateStr: "2026-03-10",
        note: "done",
        wasRed: true
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await addTransfer(mockReq, mockRes)
    res = mockRes.json.mock.calls[0][0]
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it("should return a 200", async() => {
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should return the correct fromInventoryId", async() => {
    expect(res.fromInventoryId).toBe(null)
  })

  it("should return the correct toInventoryId", async() => {
    expect(res.toInventoryId).toBe(inventory.id)
  })

  it("should return the correct quantity", async() => {
    expect(res.quantity).toBe(100)
  })

  it("should return the correct note", async() => {
    expect(res.note).toBe("done")
  })

  it("should return the correct dateStr", async() => {
    expect(res.dateStr).toBe("2026-03-10")
  })
})