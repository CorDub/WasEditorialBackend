import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { sendInvoice } from "../../routes/authorRoutes.js";
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
import * as mailer from "../../mailer.js"

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
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
    vi.useFakeTimers()
    vi.setSystemTime("2025-11-04")

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
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: [mockReq.body.correo]})
  })

  afterAll(async() => {
    vi.useRealTimers();
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
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy, mute;
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
    vi.useFakeTimers()
    vi.setSystemTime('2025-11-04')

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
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    vi.useRealTimers();
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
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy, mute;
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
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-04"))

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
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    vi.useRealTimers();
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
  let mockReq, mockRes, jsonRes, updatedPayment, mailerSpy, mute;
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
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-04"))

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
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailerSpy = vi.spyOn(mailer, "sendEmailWithInvoice").mockResolvedValue({ accepted: []})
    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    vi.useRealTimers();
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