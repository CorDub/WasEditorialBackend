import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getMonthlySalesByPayments,
  getAuthorPayments,
  sendInvoice,
  getAuthorCosts
} from "../../routes/authorRoutes.js";
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


describe(`getting all valid monthly sales by payments`, () => {
  let mockReq, mockRes, jsonRes;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;
  let cost1, cost2, cost3;

  beforeAll(async() => {
    category1 = await createCategory(prisma, "premium", 100)
    author = await createAuthor(prisma, "Sizi", "Urifon", "sizi.urifon@gmail.com", "author", {categoryId: category1.id})
    book1 = await createBook(prisma, "book1", [{"id": author.id}])
    book2 = await createBook(prisma, "book2", [{"id": author.id}])
    bookstore1 = await createBookstore(prisma, "bookstore1")
    bookstore2 = await createBookstore(prisma, "bookstore2", {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, 100, 70, false, 0, 0)
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, 100, 90, false, 0, 0)
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [{"id": payment1.id}], 10, {date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [{"id": payment1.id}], 10, {date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [{"id": payment1.id}], 10, {isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [{"id": payment2.id}], 10, {date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [{"id": payment3.id}], 10, {date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [{"id": payment1.id}], 5, 5, new Date("2025-08-02"), new Date("2025-10-02"), 100)
    kindleSale2 = await createKindleSale(prisma, book2.id, [{"id": payment2.id}], 5, 5, new Date("2025-07-02"), new Date("2025-09-02"), 100)
    kindleSale3 = await createKindleSale(prisma, book1.id, [{"id": payment3.id}], 5, 5, new Date("2023-08-02"), new Date("2023-10-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, book1.id, [{"id": payment1.id}], 5, 5, new Date("2025-08-02"), new Date("2025-10-02"), 100, {isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, 100)
    cost2 = await createCost(prisma, payment2.id, book2.id, 100)
    cost3 = await createCost(prisma, payment1.id, book1.id, 100, {isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, cost1, "cost")
    await deleteFromDB(prisma, cost2, "cost")
    await deleteFromDB(prisma, cost3, "cost")    
    await deleteFromDB(prisma, kindleSale1, "kindleSale")
    await deleteFromDB(prisma, kindleSale2, "kindleSale")
    await deleteFromDB(prisma, kindleSale3, "kindleSale")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, sale1, "sale")
    await deleteFromDB(prisma, sale2, "sale")
    await deleteFromDB(prisma, sale3, "sale")
    await deleteFromDB(prisma, sale4, "sale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, payment1, "payment")
    await deleteFromDB(prisma, payment2, "payment")
    await deleteFromDB(prisma, payment3, "payment")
    await deleteFromDB(prisma, inventory1, "inventory")
    await deleteFromDB(prisma, inventory2, "inventory")
    await deleteFromDB(prisma, bookstore1, "bookstore")
    await deleteFromDB(prisma, bookstore2, "bookstore")
    await deleteFromDB(prisma, book1, "book")
    await deleteFromDB(prisma, book2, "book")
    await deleteFromDB(prisma, author, "author")
    await deleteFromDB(prisma, category1, "category")
  })

  it(`should return status 200`, async() => {
    await getMonthlySalesByPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return sales grouped by month within last 12 months`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes.length).toBe(13)
  })

  it(`should return the total for each month, taking into account sales, kindleSales and costs, 
  and excluding deleted and out of range sales`, async() => {
    expect(jsonRes[1].sales.length).toBe(2)
    expect(jsonRes[1].costs.length).toBe(1)
    expect(jsonRes[1].totalQuantity).toBe(30)
    expect(jsonRes[1].totalValue).toBe(7499.83)

    expect(jsonRes[2].sales.length).toBe(2)
    expect(jsonRes[2].costs.length).toBe(1)
    expect(jsonRes[2].totalQuantity).toBe(20)
    expect(Number(jsonRes[2].totalValue.toFixed(2))).toBe(3499.93)
  })

  it(`should pad months with no sales with empty data`, async() => {
    expect(jsonRes[0].sales).toStrictEqual([])
    expect(jsonRes[0].costs).toStrictEqual([])
    expect(jsonRes[3].sales).toStrictEqual([])
    expect(jsonRes[3].costs).toStrictEqual([])
    expect(jsonRes[4].sales).toStrictEqual([])
    expect(jsonRes[4].costs).toStrictEqual([])
    expect(jsonRes[5].sales).toStrictEqual([])
    expect(jsonRes[5].costs).toStrictEqual([])
    expect(jsonRes[6].sales).toStrictEqual([])
    expect(jsonRes[6].costs).toStrictEqual([])
    expect(jsonRes[7].sales).toStrictEqual([])
    expect(jsonRes[7].costs).toStrictEqual([])
    expect(jsonRes[8].sales).toStrictEqual([])
    expect(jsonRes[8].costs).toStrictEqual([])
    expect(jsonRes[9].sales).toStrictEqual([])
    expect(jsonRes[9].costs).toStrictEqual([])
    expect(jsonRes[10].sales).toStrictEqual([])
    expect(jsonRes[10].costs).toStrictEqual([])
    expect(jsonRes[11].sales).toStrictEqual([])
    expect(jsonRes[11].costs).toStrictEqual([])
    expect(jsonRes[12].sales).toStrictEqual([])
    expect(jsonRes[12].costs).toStrictEqual([])    
  })

  it(`should sort the months in descending order (newer first)`, async() => {
    expect(jsonRes[0].forMonth).toBe("2025-11")
    expect(jsonRes[12].forMonth).toBe("2024-11")
  })
})


describe(`getting all valid ltm payments for the author`, async() => {
  let mockReq, mockRes, jsonRes;
  let category1;
  let author;
  let book1, book2;
  let bookstore1, bookstore2;
  let inventory1, inventory2;
  let payment1, payment2, payment3; 
  let sale1, sale2, sale3, sale4, deletedSale;
  let kindleSale1, kindleSale2, kindleSale3, deletedKindleSale;
  let cost1, cost2, cost3;

  beforeAll(async() => {
    category1 = await createCategory(prisma, "premium", 100)
    author = await createAuthor(prisma, "Sizo", "Urofin", "sizi.urofin@gmail.com", "author", {categoryId: category1.id})
    book1 = await createBook(prisma, "book1", [{"id": author.id}])
    book2 = await createBook(prisma, "book2", [{"id": author.id}])
    bookstore1 = await createBookstore(prisma, "bookstore1")
    bookstore2 = await createBookstore(prisma, "bookstore2", {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, 100, 70, false, 0, 0)
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, 100, 90, false, 0, 0)
    payment1 = await createPayment(prisma, author.id, "2025-10", {status: "created"})
    payment2 = await createPayment(prisma, author.id, "2025-09", {status: "solicited"})
    payment3 = await createPayment(prisma, author.id, "2023-10", {status: "solicited"})
    sale1 = await createSale(prisma, inventory1.id, [{"id": payment1.id}], 10, {date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [{"id": payment1.id}], 10, {date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [{"id": payment1.id}], 10, {isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [{"id": payment2.id}], 10, {date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [{"id": payment3.id}], 10, {date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [{"id": payment1.id}], 5, 5, new Date("2025-08-02"), new Date("2025-10-02"), 100)
    kindleSale2 = await createKindleSale(prisma, book2.id, [{"id": payment2.id}], 5, 5, new Date("2025-07-02"), new Date("2025-09-02"), 100)
    kindleSale3 = await createKindleSale(prisma, book1.id, [{"id": payment3.id}], 5, 5, new Date("2023-08-02"), new Date("2023-10-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, book1.id, [{"id": payment1.id}], 5, 5, new Date("2025-08-02"), new Date("2025-10-02"), 100, {isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, 100)
    cost2 = await createCost(prisma, payment2.id, book2.id, 100)
    cost3 = await createCost(prisma, payment1.id, book1.id, 100, {isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, cost1, "cost")
    await deleteFromDB(prisma, cost2, "cost")
    await deleteFromDB(prisma, cost3, "cost")    
    await deleteFromDB(prisma, kindleSale1, "kindleSale")
    await deleteFromDB(prisma, kindleSale2, "kindleSale")
    await deleteFromDB(prisma, kindleSale3, "kindleSale")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, sale1, "sale")
    await deleteFromDB(prisma, sale2, "sale")
    await deleteFromDB(prisma, sale3, "sale")
    await deleteFromDB(prisma, sale4, "sale")
    await deleteFromDB(prisma, deletedSale, "sale")
    await deleteFromDB(prisma, payment1, "payment")
    await deleteFromDB(prisma, payment2, "payment")
    await deleteFromDB(prisma, payment3, "payment")
    await deleteFromDB(prisma, inventory1, "inventory")
    await deleteFromDB(prisma, inventory2, "inventory")
    await deleteFromDB(prisma, bookstore1, "bookstore")
    await deleteFromDB(prisma, bookstore2, "bookstore")
    await deleteFromDB(prisma, book1, "book")
    await deleteFromDB(prisma, book2, "book")
    await deleteFromDB(prisma, author, "author")
    await deleteFromDB(prisma, category1, "category")
  })

  it(`should return status 200`, async() => {
    await getAuthorPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return a package with all payments from the last 12 months`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes.length).toBe(13)
  })

  it(`should return an object with forMonth, status and amount for each month`, async() => {
    try {
      for (const month of jsonRes) {
        expect(Object.keys(month)).toEqual(['forMonth','status','amount'])
      }
    } catch (error) {
      console.log(`Error `, error)
      throw error
    }
  })

  it(`should return months in descending order (newest first)`, async() => {
    expect(jsonRes[0].forMonth).toBe("2025-11")
    expect(jsonRes[12].forMonth).toBe("2024-11")
  })

  it(`should correctly calculate the amount for each month, 
  excluding deleted and out of range sales, kindleSales and costs`, async() => {
    expect(jsonRes[0].amount).toBe(0)
    expect(jsonRes[1].amount).toBe(7499.83)
    expect(jsonRes[2].amount).toBe(3499.93)
    expect(jsonRes[3].amount).toBe(0)
    expect(jsonRes[4].amount).toBe(0)
    expect(jsonRes[5].amount).toBe(0)
    expect(jsonRes[6].amount).toBe(0)
    expect(jsonRes[7].amount).toBe(0)
    expect(jsonRes[8].amount).toBe(0)
    expect(jsonRes[9].amount).toBe(0)
    expect(jsonRes[10].amount).toBe(0)
    expect(jsonRes[11].amount).toBe(0)
    expect(jsonRes[12].amount).toBe(0)
  })

  it(`should correctly return the status for each month`, async() => {
    expect(jsonRes[0].status).toBe("created")
    expect(jsonRes[1].status).toBe("created")
    expect(jsonRes[2].status).toBe("solicited")
    expect(jsonRes[3].status).toBe("created")
    expect(jsonRes[4].status).toBe("created")
    expect(jsonRes[5].status).toBe("created")
    expect(jsonRes[6].status).toBe("created")
    expect(jsonRes[7].status).toBe("created")
    expect(jsonRes[8].status).toBe("created")
    expect(jsonRes[9].status).toBe("created")
    expect(jsonRes[10].status).toBe("created")
    expect(jsonRes[11].status).toBe("created")
    expect(jsonRes[12].status).toBe("created")
  })
})