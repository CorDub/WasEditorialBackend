import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { deleteKindleSale } from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createPayment,
  createKindleSale,
  createTestDB,
  dropTestDB,
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



describe(`deleting a kindleSale with valid parameters`, async() => {
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
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a 200 status`, async() => {
    await deleteKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should mark the kindle sale as deleted`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(updatedKindleSale.isDeleted).toBe(true);
  })
})