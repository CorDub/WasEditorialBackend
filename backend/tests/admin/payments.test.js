import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getPayments, markPaymentAsPaid } from "../../routes/adminRoutes.js";
import { prisma } from "../../prisma/client.js";
import {
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  deleteFromDB, 
  createCategory
} from "../../testUtils.js";

describe(`getting all valid solicited payments`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "solicited"
      }
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
    console.log("jsonResponse", jsonResponse);
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
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "created"
      }
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
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      query: {
        status: "paid"
      }
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


describe(`marking a solicited payment as paid`, async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      params: {
        id: newPayment.id
      }
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

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      params: {
        id: deletedPayment.id
      }
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
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      params: {
        id: createdPayment.id
      }
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
  let deletedPayment;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", {isDeleted: false, categoryId: newCategory2.id})
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mockReq = {
      params: {
        id: paidPayment.id
      }
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

  it(`should return a 500 status`, async() => {
    await markPaymentAsPaid(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the payment in the database`, async() => {
    const updatedPayment = await prisma.payment.findUnique({where: {id: paidPayment.id}});
    expect(updatedPayment.dateMarkedAsPaid).toBe(null)
  })
})