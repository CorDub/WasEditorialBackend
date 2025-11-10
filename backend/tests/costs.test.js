import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getCurrentCosts, addCost, updateCost, deleteCost } from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
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
} from "../testUtils.js";

describe('getting all valid current costs', async() => {
  let newAuthor, newAuthor2, newBook, newBookstore, newInventory, newPayment, newPayment2;
  let newSale, newSale2, deletedSale, newKindleSale, newKindleSale2, deletedKindleSale, newCost;
  let newCategory, newBookstoreComissions, newInventory2, newSale3, newCategory2;
  let mockRes, mockReq, jsonResponse, specificPayment, specificPayment2, createdPayment, paidPayment;
  let deletedPayment, newCost2, deletedCost, costFromDeletedPayment, createdPayment2;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "premium", 180);
    newCategory2 = await createCategory(prisma, "remium2", 150)
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false, newCategory2.id)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false, newCategory.id)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newBookstore = await createBookstore(prisma, "newBookstore")
    newBookstoreComissions = await createBookstore(prisma, "newBookstoreCommissions", {comissions: true})
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 900, false, 0, 0)
    newInventory2 = await createInventory(prisma, newBook.id, newBookstoreComissions.id, 1000, 900, false, 0, 0)
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11", {status: "solicited"})
    deletedPayment = await createPayment(prisma, newAuthor.id, "2025-07", {status: "solicited", isDeleted: true})
    createdPayment = await createPayment(prisma, newAuthor.id, "2025-10", {status: "created"})
    createdPayment2 = await createPayment(prisma, newAuthor2.id, "2025-10", {status: "created"})
    paidPayment = await createPayment(prisma, newAuthor.id, "2025-09", {status: "paid"})
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale2 = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    newSale3 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100)
    deletedSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 100, {isDeleted: true})
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, dateCut, new Date(), 100, {isDeleted: true})
    newCost = await createCost(prisma, createdPayment.id, newBook.id, 100, {note : "newCost"});
    newCost2 = await createCost(prisma, createdPayment.id, newBook.id, 100, {note : "newCost2"});
    deletedCost = await createCost(prisma, createdPayment2.id, newBook.id, 100, {isDeleted: true, note: "deletedCost"});
    costFromDeletedPayment = await createCost(prisma, deletedPayment.id, newBook.id, 100, {note : "costeFromDeletedPayment"});

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, costFromDeletedPayment, "cost")
    await deleteFromDB(prisma, deletedCost, "cost")
    await deleteFromDB(prisma, newCost2, "cost")
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, newSale3, "sale")
    await deleteFromDB(prisma, newSale2, "sale")
    await deleteFromDB(prisma, newSale, "sale")
    await deleteFromDB(prisma, deletedPayment, "payment")
    await deleteFromDB(prisma, createdPayment2, "payment")
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
    await getCurrentCosts({}, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should not return deleted Costs or costs from deleted payments`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0];
    expect(jsonResponse.length).toBe(2);
    for (const cost of jsonResponse) {
      try {
        expect([newCost.id, newCost2.id]).toContain(cost.id)
      } catch(error) {
        console.log(`error at the cost with the id ${cost.id}`)
        throw new Error('noppppppe')
      }
    }
  })
})


describe("adding a valid cost without paymentId", () => {
  let newAuthor, newAuthor2, newBook, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCosts

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])

    mockReq = {
      body: {
        "amount": "50.25",
        "note": "Costos adicionales de impresion",
        "bookId": newBook.id
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  afterAll(async() => {
    for (const cost of addedCosts) {await deleteFromDB(prisma, cost, "cost")}
    for (const payment of extraPayments) {await deleteFromDB(prisma, payment, "payment")}
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
  })

  it("should return status 201 and return json with message", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "message": "Cost created successfully",
    })
  })

  it(`should correctly create a cost for each payment tied to the authors list`, async() => {
    addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
    expect(addedCosts.length).toBe(2)
  })

  it(`should correctly create new payments if they're not provided`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(2)
  })

  it(`should create the costs with the right data`, async() => {
    for (const cost of addedCosts) {
      try {
        expect(cost.amount).toBe(50.25)
        expect(cost.note).toBe("Costos adicionales de impresion")
        expect(cost.bookId).toBe(newBook.id)
      } catch(error) {
        console.log(`error at cost with id ${cost.id}`)
        throw new Error("oh no")
      }
    }
  })
})


describe(`adding a valid cost with paymentId`, async() => {
  let newAuthor, newAuthor2, newBook, newPayment, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCosts

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})

    mockReq = {
      body: {
        "paymentId": newPayment.id,
        "amount": "50.25",
        "note": "Costos adicionales de impresion",
        "bookId": newBook.id
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  afterAll(async() => {
    for (const cost of addedCosts) {await deleteFromDB(prisma, cost, "cost")}
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
  })

  it("should return status 201 and return json with message", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "message": "Cost created successfully",
    })
  })

  it(`should only create a cost for the paymentId provided`, async() => {
    addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
    expect(addedCosts.length).toBe(1)
  })

  it(`should not create new payments if a paymentId is provided`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(1)
  })

  it(`should create the cost with the right data`, async() => {
    for (const cost of addedCosts) {
      try {
        expect(cost.amount).toBe(50.25)
        expect(cost.note).toBe("Costos adicionales de impresion")
        expect(cost.bookId).toBe(newBook.id)
      } catch(error) {
        console.log(`error at cost with id ${cost.id}`)
        throw new Error("oh no")
      }
    }
  })
})


describe(`adding an invalid cost`, async() => {
  let newAuthor, newAuthor2, newBook, newPayment, extraPayments;
  let mockRes, mockReq, jsonResponse;
  let addedCosts

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})

    mockReq = {
      body: {
        "paymentId": newPayment.id,
        "amount": "cinquenta punto veinti cinco",
        "note": "Costos adicionales de impresion",
        "bookId": newBook.id
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  afterAll(async() => {
    for (const cost of addedCosts) {await deleteFromDB(prisma, cost, "cost")}
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor2, "author")
    await deleteFromDB(prisma, newAuthor, "author")
  })

  it("should return status 500", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it(`should not create a cost for the paymentId provided`, async() => {
    addedCosts = await prisma.cost.findMany({where: {bookId: newBook.id}});
    expect(addedCosts.length).toBe(0)
  })

  it(`should not create new payments`, async() => {
    extraPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [newAuthor.id, newAuthor2.id]
        }
      }
    })
    expect(extraPayments.length).toBe(1)
  })
})


describe(`updating a cost with valid parameters`, async() => {
  let mockReq, mockRes; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 50.25, {note: "newCost"})

    mockReq = {
      params: {
        id: newCost.id
      },
      body: {
        amount: 100.25,
        note: "newCosy",
        bookId: newBook.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a status 200`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should properly update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(100.25)
    expect(updatedCost.note).toBe("newCosy")
  })
})


describe(`updating a cost with invalid parameters`, async() => {
  let mockReq, mockRes; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 50.25, {note: "newCost"})

    mockReq = {
      params: {
        id: newCost.id
      },
      body: {
        amount: "cien venticinco",
        note: "newCosy",
        bookId: newBook.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a status 500`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(50.25)
    expect(updatedCost.note).toBe("newCost")
  })
})


describe(`updating a deleted cost`, async() => {
  let mockReq, mockRes; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 50.25, {note: "newCost", isDeleted: true})

    mockReq = {
      params: {
        id: newCost.id
      },
      body: {
        amount: 100.25,
        note: "newCosy",
        bookId: newBook.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a status 500`, async() => {
    await updateCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the cost in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.amount).toBe(50.25)
    expect(updatedCost.note).toBe("newCost")
  })
})

// DELETING
describe(`deleting a cost with valid parameters`, async() => {
  let mockReq, mockRes; 
  let newCost, newPayment, newBook, newAuthor, newAuthor2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "b", "a.b@gmail.com", "author", false)
    newAuthor2 = await createAuthor(prisma, "b", "c", "b.c@gmail.com", "author", false)
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11", {status: "solicited"})
    newCost = await createCost(prisma, newPayment.id, newBook.id, 50.25, {note: "newCost"})

    mockReq = {
      params: {
        id: newCost.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newCost, "cost")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a status 200`, async() => {
    await deleteCost(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should mark the cost as deleted in the database`, async() => {
    const updatedCost = await prisma.cost.findUnique({where: {id: newCost.id}})
    expect(updatedCost.isDeleted).toBe(true)
  })
})