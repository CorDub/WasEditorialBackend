import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getMonthlySalesByPayments,
  getAuthorPayments,
  sendInvoice,
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
  createCategory,
  createTestDB,
  dropTestDB
} from "../../testUtils.js";
import * as mailer from "../../mailer.js"


// import { PrismaClient } from '@prisma/client';
// let prisma;
// let testDBName;

// beforeAll(async() => {
//   testDBName = createTestDB();
//   process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
//   prisma = new PrismaClient();
//   await prisma.$connect();
// })

// afterAll(async() => {
//   await prisma.$disconnect();
//   dropTestDB(testDBName);
// })


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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10", {status: "created"})
    payment2 = await createPayment(prisma, author.id, "2025-09", {status: "solicited"})
    payment3 = await createPayment(prisma, author.id, "2023-10", {status: "solicited"})
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

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


describe(`getting payments but not loggedd in`, async() => {
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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: undefined
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

  it(`should return status 401`, async() => {
    await getAuthorPayments(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not return any data`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({message: "Unauthorized"})
  })
})


describe(`sending invoice with valid parameters`, async() => {
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy;
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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      body: {
        month: "Oct 2025",
        monthOriginal: "2025-10",
        amount: 7499.83,
        correo: author.email
      },
      files: {
        factura: [{
          originalname: "factura.pdf",
          buffer: Buffer.from('factura data'),
          mimetype: 'application/pdf',
          size: Buffer.from('factura data').length
        }],
        constancia: [{
          originalname: "constancia.pdf",
          buffer: Buffer.from("constancia data"),
          mimetype: "application/pdf",
          size: Buffer.from("constancia data").length
        }]
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: [mockReq.body.correo]})
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

    vi.restoreAllMocks();
  })

  it(`should return status 200`, async() => {
    await sendInvoice(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send an email with the invoice and constancia`, async() => {
    expect(mailerSpy).toHaveBeenCalledWith(
      author.first_name + " " + author.last_name,
      "Oct 2025",
      7499.83,
      mockReq.files.factura[0],
      mockReq.files.constancia[0],
      author.email
    )
  })
  

  it(`should update the status of the payment`, async() => {
    updatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: "2025-10"
        }
      }
    })
    expect(updatedPayment.status).toBe("solicited")
  })

  it(`should confirm the successful invoice send`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({message: "invoice sent successfully"})
  })
})


describe(`sending invoice but the email fails`, async() => {
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy;
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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      body: {
        month: "Oct 2025",
        monthOriginal: "2025-10",
        amount: 7499.83,
        correo: author.email
      },
      files: {
        factura: [{
          originalname: "factura.pdf",
          buffer: Buffer.from('factura data'),
          mimetype: 'application/pdf',
          size: Buffer.from('factura data').length
        }],
        constancia: [{
          originalname: "constancia.pdf",
          buffer: Buffer.from("constancia data"),
          mimetype: "application/pdf",
          size: Buffer.from("constancia data").length
        }]
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
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

    vi.restoreAllMocks();
  })

  it(`should return status 500`, async() => {
    await sendInvoice(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should try to send an email with the invoice and constancia`, async() => {
    expect(mailerSpy).toHaveBeenCalledWith(
      author.first_name + " " + author.last_name,
      "Oct 2025",
      7499.83,
      mockReq.files.factura[0],
      mockReq.files.constancia[0],
      author.email
    )
  })
  

  it(`should not update the status of the payment`, async() => {
    updatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: "2025-10"
        }
      }
    })
    expect(updatedPayment.status).toBe("created")
  })

  it(`should infirm the successful invoice send`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({error: "a server error occurred while sending the invoice"})
  })
})


describe(`sending invoice but wrong file type`, async() => {
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy;
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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      body: {
        month: "Oct 2025",
        monthOriginal: "2025-10",
        amount: 7499.83,
        correo: "sizo.urofin@gmail.com"
      },
      files: {
        factura: [{
          originalname: "factura.pdf",
          buffer: Buffer.from('factura data'),
          mimetype: 'image/webp',
          size: Buffer.from('factura data').length
        }],
        constancia: [{
          originalname: "constancia.pdf",
          buffer: Buffer.from("constancia data"),
          mimetype: "application/pdf",
          size: Buffer.from("constancia data").length
        }]
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
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

    vi.restoreAllMocks();
  })

  it(`should return status 500`, async() => {
    await sendInvoice(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not try to send an email with the invoice and constancia`, async() => {
    expect(mailerSpy).not.toHaveBeenCalled()
  })
  

  it(`should not update the status of the payment`, async() => {
    updatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: "2025-10"
        }
      }
    })
    expect(updatedPayment.status).toBe("created")
  })

  it(`should infirm the successful invoice send`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({error: "a server error occurred while sending the invoice"})
  })
})


describe(`sending invoice but the file is too big`, async() => {
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy;
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
    category1 = await createCategory(prisma, {management_min:100})
    author = await createAuthor(prisma, {categoryId: category1.id})
    book1 = await createBook(prisma, [author.id])
    book2 = await createBook(prisma, [author.id])
    bookstore1 = await createBookstore(prisma)
    bookstore2 = await createBookstore(prisma, {comissions: true})
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 100, current: 70})
    inventory2 = await createInventory(prisma, book2.id, bookstore2.id, {initial: 100, current: 90})
    payment1 = await createPayment(prisma, author.id, "2025-10")
    payment2 = await createPayment(prisma, author.id, "2025-09")
    payment3 = await createPayment(prisma, author.id, "2023-10")
    sale1 = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    sale2 = await createSale(prisma, inventory2.id, [payment1.id], {quantity: 10, date: new Date("2025-10-02")})
    deletedSale = await createSale(prisma, inventory1.id, [payment1.id], {quantity: 10, isDeleted: true, date: new Date("2025-10-02")})
    sale3 = await createSale(prisma, inventory1.id, [payment2.id], {quantity: 10, date: new Date("2025-09-02")})
    sale4 = await createSale(prisma, inventory1.id, [payment3.id], {quantity: 10, date: new Date("2023-10-02")})
    kindleSale1 = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100})
    kindleSale2 = await createKindleSale(prisma, book2.id, [payment2.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-09-02"), regalias: 100})
    kindleSale3 = await createKindleSale(prisma, book1.id, [payment3.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2023-10-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, book1.id, [payment1.id], {quantityEbook: 5, quantityPod: 5, datePay: new Date("2025-10-02"), regalias: 100, isDeleted: true})
    cost1 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100})
    cost2 = await createCost(prisma, payment2.id, book2.id, {amoutn: 100})
    cost3 = await createCost(prisma, payment1.id, book1.id, {amoutn: 100, isDeleted: true})

    mockReq = {
      session: {
        user_id: author.id
      },
      body: {
        month: "Oct 2025",
        monthOriginal: "2025-10",
        amount: 7499.83,
        correo: "sizo.urofin@gmail.com"
      },
      files: {
        factura: [{
          originalname: "factura.pdf",
          buffer: Buffer.from('factura data'),
          mimetype: 'application/pdf',
          size: 6*1024*1024
        }],
        constancia: [{
          originalname: "constancia.pdf",
          buffer: Buffer.from("constancia data"),
          mimetype: "application/pdf",
          size: Buffer.from("constancia data").length
        }]
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
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

    vi.restoreAllMocks();
  })

  it(`should return status 500`, async() => {
    await sendInvoice(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should try to send an email with the invoice and constancia`, async() => {
    expect(mailerSpy).not.toHaveBeenCalled()
  })
  
  it(`should not update the status of the payment`, async() => {
    updatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author.id,
          forMonth: "2025-10"
        }
      }
    })
    expect(updatedPayment.status).toBe("created")
  })

  it(`should infirm the successful invoice send`, async() => {
    jsonRes = mockRes.json.mock.calls[0][0]
    expect(jsonRes).toEqual({error: "a server error occurred while sending the invoice"})
  })
})