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
    newKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100})
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [newPayment.id, newPayment2.id], {quantityEbook: 10, quantityPod: 10, datePay: new Date("2025-06-02"), regalias: 100, isDeleted: true})


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
    // await deleteFromDB(prisma, newKindleSale, "kindleSale")
    // await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    // await deleteFromDB(prisma, newPayment2, "payment")
    // await deleteFromDB(prisma, newPayment, "payment")
    // await deleteFromDB(prisma, newBook, "book")
    // await deleteFromDB(prisma, newAuthor, "author")
    // await deleteFromDB(prisma, newAuthor2, "author")
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