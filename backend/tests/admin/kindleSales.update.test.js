import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../utils.js";
import { updateKindleSale } from "../../routes/adminRoutes.js";
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



describe(`updating Kindle sale with valid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, deletedKindleSale, updatedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100, isDeleted: true})

    mockReq = {
      params: {
        id: newKindleSale.id
      },
      body: {
        quantityEbook: 100,
        quantityPod: 100,
        dateCut: "2025-09-13T00:00:00.000Z",
        datePay: "2025-11-13T00:00:00.000Z",
        regalias: 121000.5
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await updateKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should properly update the kindle sale`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(updatedKindleSale.quantityEbook).toBe(100),
    expect(updatedKindleSale.quantityPod).toBe(100),
    expect(updatedKindleSale.regalias).toBe(121000.5)
  })
})



describe(`updating a kindleSale date for a book with multiple authors`, async() => {
  let mockReq, mockRes;
  let newAuthor, newAuthor2, newAuthor3, newAuthor4;
  let newBook;
  let newPayment, newPayment2, newPayment3, newPayment4;
  let oldPayment, oldPayment2, oldPayment3;
  let newKindleSale, deletedKindleSale, updatedKindleSale, createdPayment, recreatedPayment;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newAuthor3 = await createAuthor(prisma);
    newAuthor4 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id, newAuthor3.id, newAuthor4.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newPayment3 = await createPayment(prisma, newAuthor3.id, "2025-11")
    newPayment4 = await createPayment(prisma, newAuthor4.id, "2025-11")
    oldPayment = await createPayment(prisma, newAuthor.id, "2025-10")
    oldPayment2 = await createPayment(prisma, newAuthor2.id, "2025-10")
    oldPayment3 = await createPayment(prisma, newAuthor3.id, "2025-10", {isDeleted: true}) 
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id, newPayment3.id, newPayment4.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-11-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-11-02"), regalias: 100, isDeleted: true})


    mockReq = {
      params: {
        id: newKindleSale.id
      },
      body: {
        quantityEbook: 100,
        quantityPod: 100,
        dateCut: "2025-08-13T00:00:00.000Z",
        datePay: "2025-10-13T00:00:00.000Z",
        regalias: 121000.5
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await updateKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should properly update the kindle sale`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}, include: {payments: true}});
    expect(updatedKindleSale.quantityEbook).toBe(100),
    expect(updatedKindleSale.quantityPod).toBe(100),
    expect(updatedKindleSale.regalias).toBe(121000.5)
  })

  it(`should change all the payments it's tied to`, async() => {
    expect(updatedKindleSale.payments.length).toBe(4);
    for (const payment of updatedKindleSale.payments) {
      try {
        expect(payment.forMonth).toBe("2025-10");
      } catch(error) {
        
        console.log(`there was an error with payment ${payment.id}`)
        throw error
      }
    }
  })

  it(`should create the payment if it didn't exist`, async() => {
    createdPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: newAuthor4.id,
          forMonth: "2025-10"
        }
      }
    });
    expect(createdPayment).toBeTruthy();
  })

  it(`should delete the payment and create a new one if it was marked deleted`, async() => {
    recreatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: newAuthor3.id,
          forMonth: "2025-10"
        }
      }
    });
    expect(recreatedPayment).toBeTruthy();
    expect(recreatedPayment.id).not.toBe(oldPayment3.id);
  })
})



describe('updating a deleted Kindle sale', async() => {
  let mockReq, mockRes, mute;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, deletedKindleSale, updatedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id, newAuthor2.id])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100, isDeleted: true})

    mockReq = {
      params: {
        id: deletedKindleSale.id
      },
      body: {
        quantityEbook: 100,
        quantityPod: 100,
        dateCut: "2025-08-13T00:00:00.000Z",
        datePay: "2025-10-13T00:00:00.000Z",
        regalias: 121000.5
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await updateKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the kindle sale`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(updatedKindleSale.quantityEbook).toBe(10),
    expect(updatedKindleSale.quantityPod).toBe(10),
    expect(updatedKindleSale.regalias).toBe(100)
  })
})



describe(`updating the date of a kindleSale but the payment for that date is unavailable 
(deleted, paid or solicited)`, async() => {
  let mockReq, mockRes, res;
  let author1, author2, author3;
  let book;
  let bookstore;
  let inventory;
  let payment1, payment2, payment3, payment4, payment5, payment6, payment7, payment8;
  let kindleSale;

  beforeAll(async() => {
    author1 = await createAuthor(prisma);
    author2 = await createAuthor(prisma);
    author3 = await createAuthor(prisma);
    book = await createBook(prisma, [author1.id, author2.id, author3.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id);
    payment1 = await createPayment(prisma, author1.id, "2025-06", {status: "paid"})
    payment2 = await createPayment(prisma, author1.id, "2025-07", {status: "solicited"})
    payment3 = await createPayment(prisma, author1.id, "2025-08", {status: "created"})
    payment4 = await createPayment(prisma, author2.id, "2025-06", {status: "paid"})
    payment5 = await createPayment(prisma, author2.id, "2025-07", {status: "paid"})
    payment6 = await createPayment(prisma, author2.id, "2025-08", {status: "created"})
    payment7 = await createPayment(prisma, author3.id, "2025-06", {isDeleted: true})
    payment8 = await createPayment(prisma, author3.id, "2025-07", {status: "solicited"})
    kindleSale = await createKindleSale(prisma, book.id, [payment2.id, payment5.id, payment8.id], {datePay: new Date("2025-07-04")})

    mockReq = {
      params: {
        id: kindleSale.id
      },
      body: {
        quantityEbook: 10,
        quantityPod: 10,
        dateCut: new Date("2025-04-04"),
        datePay: new Date("2025-06-04"),
        regalias: 100
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should find the nearest available date 
  and reassign the kindle sale to this payment`, async() => {
    await updateKindleSale(mockReq, mockRes);
    res = await prisma.kindleSale.findUnique({where: {id: kindleSale.id}, include: {payments: true}})
    expect(res.payments.length).toBe(3)
  })

  it(`should reassign the sale to the closest created payment status for an author`, async() => {
    const author1payment = res.payments.find(payment => payment.userId === author1.id)
    expect(author1payment.id).toBe(payment3.id)

    const author2payment = res.payments.find(payment => payment.userId === author2.id)
    expect(author2payment.id).toBe(payment6.id)
  })

  it(`should recreate the payment if the sale is deleted or doesn't exist`, async() => {
    const author3payment = res.payments.find(payment => payment.userId === author3.id)
    expect(author3payment.forMonth).toBe("2025-06")
    expect(author3payment.id).not.toBe(payment7.id)
  })
})