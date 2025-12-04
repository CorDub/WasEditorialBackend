import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import {
  getPayments
} from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



describe(`getting all valid solicited payments`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {managment_min: 180});
    newCategory2 = await createCategory(prisma, {management_min: 150});
    newAuthor = await createAuthor(prisma, {categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, {categoryId: newCategory.id})
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newBookstore = await createBookstore(prisma)
    newBookstoreComissions = await createBookstore(prisma, {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 900})
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, {initial: 1000, current: 900})
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale3 = await createSale(prisma, newInventory2.id, [newPayment.id, newPayment2.id], {quantity: 100})
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100, isDeleted: true})
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100, isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "solicited"
      },
      prisma: prisma
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, newSale3, "sale")
    await deleteFromDB(prisma, newSale2, "sale")
    await deleteFromDB(prisma, newSale, "sale")
    await deleteFromDB(prisma, deletedPayment, "payment")
    await deleteFromDB(prisma, createdPayment, "payment")
    await deleteFromDB(prisma, paidPayment, "payment")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newInventory2, "inventory")
    await deleteFromDB(prisma, newInventory, "inventory")
    await deleteFromDB(prisma, newBookstore, "bookstore")
    await deleteFromDB(prisma, newBookstoreComissions, "bookstore")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newCategory2, "category")
    await deleteFromDB(prisma, newCategory, "category")
  })

  it(`should return a status 200`, async() => {
    await getPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid solicited payments`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    for (const payment of jsonResponse) {
      try {
        expect(payment.status).toBe("solicited");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })

  it(`should not return deleted, paid or created payments`, async() => {
    for (const payment of jsonResponse) {
      try {
        expect(payment.isDeleted).toBe(false);
        expect(payment.status).toBe("solicited");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })

  it(`should properly add sales and kindle sales and deduce costs`, async() => {
    specificPayment = jsonResponse.find(element => element.id === newPayment.id)
    expect(specificPayment.amount).toBe(105097.6)
    specificPayment2 = jsonResponse.find(element => element.id === newPayment2.id)
    expect(specificPayment2.amount).toBe(102197.6)
  })
})



describe(`getting all valid created payments`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma);
    newCategory2 = await createCategory(prisma);
    newAuthor = await createAuthor(prisma, {categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, {categoryId: newCategory.id})
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newBookstore = await createBookstore(prisma)
    newBookstoreComissions = await createBookstore(prisma, {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 900})
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, {initial: 1000, current: 900})
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale3 = await createSale(prisma, newInventory2.id, [newPayment.id, newPayment2.id], {quantity: 100})
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100, isDeleted: true})
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100, isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "created"
      },
      prisma: prisma
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, newSale3, "sale")
    await deleteFromDB(prisma, newSale2, "sale")
    await deleteFromDB(prisma, newSale, "sale")
    await deleteFromDB(prisma, deletedPayment, "payment")
    await deleteFromDB(prisma, createdPayment, "payment")
    await deleteFromDB(prisma, paidPayment, "payment")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newInventory2, "inventory")
    await deleteFromDB(prisma, newInventory, "inventory")
    await deleteFromDB(prisma, newBookstore, "bookstore")
    await deleteFromDB(prisma, newBookstoreComissions, "bookstore")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newCategory2, "category")
    await deleteFromDB(prisma, newCategory, "category")
  })

  it(`should return a status 200`, async() => {
    await getPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid created payments`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    for (const payment of jsonResponse) {
      try {
        expect(payment.status).toBe("created");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })

  it(`should not return deleted, paid or created payments`, async() => {
    for (const payment of jsonResponse) {
      try {
        expect(payment.isDeleted).toBe(false);
        expect(payment.status).toBe("created");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })
})



describe(`getting all valid paid payments`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma);
    newCategory2 = await createCategory(prisma);
    newAuthor = await createAuthor(prisma, {categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, {categoryId: newCategory.id})
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newBookstore = await createBookstore(prisma)
    newBookstoreComissions = await createBookstore(prisma, {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 1000, current: 900})
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, {initial: 1000, current: 900})
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale2 = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100})
    newSale3 = await createSale(prisma, newInventory2.id, [newPayment.id, newPayment2.id], {quantity: 100})
    deletedSale = await createSale(prisma, newInventory.id, [newPayment.id, newPayment2.id], {quantity: 100, isDeleted: true})
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date(), regalias: 100, isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, {amount: 100});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "paid"
      },
      prisma: prisma
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, newSale3, "sale")
    await deleteFromDB(prisma, newSale2, "sale")
    await deleteFromDB(prisma, newSale, "sale")
    await deleteFromDB(prisma, deletedPayment, "payment")
    await deleteFromDB(prisma, createdPayment, "payment")
    await deleteFromDB(prisma, paidPayment, "payment")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newInventory2, "inventory")
    await deleteFromDB(prisma, newInventory, "inventory")
    await deleteFromDB(prisma, newBookstore, "bookstore")
    await deleteFromDB(prisma, newBookstoreComissions, "bookstore")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newCategory2, "category")
    await deleteFromDB(prisma, newCategory, "category")
  })

  it(`should return a status 200`, async() => {
    await getPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid paid payments`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    for (const payment of jsonResponse) {
      try {
        expect(payment.status).toBe("paid");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })

  it(`should not return deleted, solicited or created payments`, async() => {
    for (const payment of jsonResponse) {
      try {
        expect(payment.isDeleted).toBe(false);
        expect(payment.status).toBe("paid");

      } catch(error) {
        console.log(`error at the payment with id ${payment.id}`)
        throw new Error("nope")
      }
    }
  })
})