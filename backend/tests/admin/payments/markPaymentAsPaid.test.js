import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { markPaymentAsPaid } from "../../../routes/admin/payments/markPaymentAsPaid.js";
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
} from "../../../testUtils.js";
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



describe(`marking a solicited payment as paid`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 2});
    newCategory2 = await createCategory(prisma, {number: 3});
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
      params: {
        id: newPayment.id
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

  it(`should return a 200 status`, async() => {
    await markPaymentAsPaid(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly update the payment in the database`, async() => {
    const updatedPayment = await prisma.payment.findUnique({where: {id: newPayment.id}});
    expect(updatedPayment.status).toBe("paid")
  })
})



describe(`marking a deleted payment as paid`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;
  let mute;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 4});
    newCategory2 = await createCategory(prisma, {number: 5});
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
      params: {
        id: deletedPayment.id
      },
      prisma: prisma
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
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
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await markPaymentAsPaid(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the payment in the database`, async() => {
    const updatedPayment = await prisma.payment.findUnique({where: {id: deletedPayment.id}});
    expect(updatedPayment.status).toBe("solicited")
  })
})



describe(`marking a created payment as paid`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment, mute;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 6});
    newCategory2 = await createCategory(prisma, {number: 7});
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
      params: {
        id: createdPayment.id
      },
      prisma: prisma
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
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
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await markPaymentAsPaid(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the payment in the database`, async() => {
    const updatedPayment = await prisma.payment.findUnique({where: {id: createdPayment.id}});
    expect(updatedPayment.status).toBe("created")
  })
})



describe(`marking an already paid payment as paid`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment, mute;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, {number: 8});
    newCategory2 = await createCategory(prisma, {number: 9});
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
      params: {
        id: paidPayment.id
      },
      prisma: prisma
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
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
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await markPaymentAsPaid(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the payment in the database`, async() => {
    const updatedPayment = await prisma.payment.findUnique({where: {id: paidPayment.id}});
    expect(updatedPayment.dateMarkedAsPaid).toBe(null)
  })
})