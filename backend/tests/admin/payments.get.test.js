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
let wasBookstore;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  wasBookstore = await createBookstore(prisma, {deal_percentage: 50});
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
    newCategory = await createCategory(prisma, {number: 2, managment_min: 180, category_type: "comissions"});
    newCategory2 = await createCategory(prisma, {number: 3, management_min: 150, category_type: "regalias"});
    newAuthor = await createAuthor(prisma, {categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, {categoryId: newCategory.id})
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id], {categoryId: newCategory.id})
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

  // it(`should properly add sales and kindle sales and deduce costs`, async() => {
  //   specificPayment = jsonResponse.find(element => element.id === newPayment.id)
  //   expect(specificPayment.amount).toBe(105097.6)
  //   specificPayment2 = jsonResponse.find(element => element.id === newPayment2.id)
  //   expect(specificPayment2.amount).toBe(102197.6)
  // })
})



describe(`getting all valid created payments`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

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



describe(`making sure the correct revenue associated to payments is returned`, () => {
  let mockReq, mockRes, jsonResponse;
  let catComissions, catRegalias;
  let author1, author2;
  let book1, book2;
  let otherBookstore;
  let inventory1, inventory2, inventory3, inventory4;
  let payment1, payment2;
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, deletedKindleSale;
  let cost, cost2;

  beforeAll(async() => {
    catComissions = await createCategory(prisma, {number: 10, category_type: "comissions"})
    catRegalias = await createCategory(prisma, {number: 11, category_type: "regalias"})
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book1 = await createBook(prisma, [author1.id, author2.id], {categoryId: catComissions.id})
    book2 = await createBook(prisma, [author1.id], {categoryId: catRegalias.id})
    otherBookstore = await createBookstore(prisma, {deal_percentage: 30})
    inventory1 = await createInventory(prisma, book1.id, wasBookstore.id, {price: 300})
    inventory2 = await createInventory(prisma, book1.id, otherBookstore.id)
    inventory3 = await createInventory(prisma, book2.id, wasBookstore.id, {price: 300})
    inventory4 = await createInventory(prisma, book2.id, otherBookstore.id, {price: 300})
    payment1 = await createPayment(prisma, author1.id, "2025-11", {status: "solicited"})
    payment2 = await createPayment(prisma, author2.id, "2025-11", {status: "solicited"})

    sale1 = await createSale(prisma, inventory1.id, [payment1.id, payment2.id], {quantity: 10, date: new Date("2025-11-04")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id, payment2.id], {quantity: 10, date: new Date("2025-11-04")})
    sale3 = await createSale(prisma, inventory3.id, [payment1.id], {quantity: 10, date: new Date("2025-11-04")})
    sale4 = await createSale(prisma, inventory4.id, [payment1.id], {quantity: 10, date: new Date("2025-11-04")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-11-04")})

    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-11-04"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-11-04"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id, payment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-11-04"), regalias: 100, isDeleted: true})
    
    cost = await createCost(prisma, payment1.id, book1.id, {amount: 100, date: new Date("2025-11-04")}); 
    cost2 = await createCost(prisma, payment2.id, book1.id, {amount: 100, date: new Date("2025-11-04")});

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

  it(`should return the correct amount of payments`, async() => {
    await getPayments(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.length).toBe(2)
  })

  it(`should return the correct amount for each payment`, async() => {
    const specificPayment = jsonResponse.find(element => element.id === payment1.id)
    expect(specificPayment.amount).toBe(4963.5)
    const specificPayment2 = jsonResponse.find(element => element.id === payment2.id)
    expect(specificPayment2.amount).toBe(3763.5)
  })
})