import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getForMonth } from "../../../utils.js";
import {
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createImpression,
  deleteFromDB,
  createTestDB,
  dropTestDB,
  createCategory
} from "../../../testUtils.js";

import { deleteAuthor } from "../../../routes/admin/authors/deleteAuthor.js";
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

///DELETING
describe('deleting an author with valid parameters', () => {
  let mockReq; 
  let mockRes;
  let mute;
  let newAuthor;
  let newAuthor2;
  let bookWithOnlyAuthor; 
  let bookWithSeveralAuthors;
  let impressionBookWithOnlyAuthor;
  let impressionBookWithSeveralAuthors;
  let bookstore1; 
  let bookstore2; 
  let inventoryBookWithOnlyAuthor1;
  let inventoryBookWithOnlyAuthor2;
  let inventoryBookWithSeveralAuthors;
  let paymentNewAuthor;
  let paymentNewAuthor2;
  let saleInventoryBookWithOnlyAuthor1;
  let saleInventoryBookWithOnlyAuthor2;
  let saleInventoryBookWithSeveralAuthors;
  let kindleSaleBookWithOnlyAuthor;
  let kindleSaleBookWithSeveralAuthors;
  let costBookWithOnlyAuthor1;
  let costBookWithOnlyAuthor2;
  let costBookWithSeveralAuthors1;
  let costBookWithSeveralAuthors2;

  beforeAll(async() => {
    /// preparing data
    newAuthor = await createAuthor(prisma);
    newAuthor2 = await createAuthor(prisma);
    bookWithOnlyAuthor = await createBook(prisma, [newAuthor.id]);
    bookWithSeveralAuthors = await createBook(prisma, [newAuthor.id, newAuthor2.id]);
    impressionBookWithOnlyAuthor = await createImpression(prisma, bookWithOnlyAuthor.id, {quantity: 100});
    impressionBookWithSeveralAuthors = await createImpression(prisma, bookWithSeveralAuthors.id, {quantity: 100});
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventoryBookWithOnlyAuthor1 = await createInventory(prisma, bookWithOnlyAuthor.id, bookstore1.id, {initial: 100, current:100});
    inventoryBookWithOnlyAuthor2 = await createInventory(prisma, bookWithOnlyAuthor.id, bookstore2.id, {initial: 100, current:100});
    inventoryBookWithSeveralAuthors = await createInventory(prisma, bookWithSeveralAuthors.id, bookstore1.id, {initial: 100, current:100});
    paymentNewAuthor = await createPayment(prisma, newAuthor.id, getForMonth(new Date().toISOString()));
    paymentNewAuthor2 = await createPayment(prisma, newAuthor2.id, getForMonth(new Date().toISOString()));
    saleInventoryBookWithOnlyAuthor1 = await createSale(prisma, inventoryBookWithOnlyAuthor1.id, [paymentNewAuthor.id], {quantity: 10});
    saleInventoryBookWithOnlyAuthor2 = await createSale(prisma, inventoryBookWithOnlyAuthor2.id, [paymentNewAuthor.id], {quantity: 10});
    saleInventoryBookWithSeveralAuthors = await createSale(prisma, inventoryBookWithSeveralAuthors.id, [paymentNewAuthor.id, paymentNewAuthor2.id], {quantity: 10});
    kindleSaleBookWithOnlyAuthor = await createKindleSale(prisma, bookWithOnlyAuthor.id, [paymentNewAuthor.id], {quantityEbook: 10, quantityPod: 10, regalias: 100});
    kindleSaleBookWithSeveralAuthors = await createKindleSale(prisma, bookWithSeveralAuthors.id, [paymentNewAuthor.id, paymentNewAuthor2.id], {quantityEbook: 10, quantityPod: 10, regalias: 100});
    costBookWithOnlyAuthor1 = await createCost(prisma, paymentNewAuthor.id, bookWithOnlyAuthor.id, {amount: 10});
    costBookWithOnlyAuthor2 = await createCost(prisma, paymentNewAuthor.id, bookWithOnlyAuthor.id, {amount: 10});
    costBookWithSeveralAuthors1 = await createCost(prisma, paymentNewAuthor.id, bookWithSeveralAuthors.id, {amount: 10});
    costBookWithSeveralAuthors2 = await createCost(prisma, paymentNewAuthor2.id, bookWithSeveralAuthors.id, {amount: 10});

    mockReq = {
      params: {
        "id": newAuthor.id
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    // mute = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  let deletedAuthor;

  afterAll(async () => {
    // mute.mockRestore();
  });

  it("should return status 200 and mark the author as deleted", async() => {
    await deleteAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should mark the author as deleted in the database", async() => {
    deletedAuthor = await prisma.user.findUnique({
      where: {
        id: mockReq.params.id
      },
    })
    expect(deletedAuthor.isDeleted).toBe(true)
  })

  it("should mark as deleted books where it's the only author on cascade", async() => {
    const deletedBookWithOnlyAuthor = await prisma.book.findUnique({
      where: {
        id: bookWithOnlyAuthor.id
      }
    })
    expect(deletedBookWithOnlyAuthor.isDeleted).toBe(true)
  })

  it("should not mark as deleted books where other authors are not deleted", async() => {
    const notDeletedBookWithSeveralAuthors = await prisma.book.findUnique({
      where: {
        id: bookWithSeveralAuthors.id
      }
    })
    expect(notDeletedBookWithSeveralAuthors.isDeleted).toBe(false)
  })

  it("should mark as deleted impressions tied to the book where he's the only author", async() => {
    const deletedImpression = await prisma.impression.findUnique({
      where: {
        id: impressionBookWithOnlyAuthor.id
      }
    })
    expect(deletedImpression.isDeleted).toBe(true)
  })

  it("should not mark as deleted impressions tied to the book where he's not the only author", async() => {
    const notDeletedImpression = await prisma.impression.findUnique({
      where: {
        id: impressionBookWithSeveralAuthors.id
      }
    })
    expect(notDeletedImpression.isDeleted).toBe(false)
  })

  it("should mark as deleted inventories for book where it's the only author", async() => {
    const deletedInventory1 = await prisma.inventory.findUnique({
      where: {
        id: inventoryBookWithOnlyAuthor1.id
      }
    })
    expect(deletedInventory1.isDeleted).toBe(true);
    const deletedInventory2 = await prisma.inventory.findUnique({
      where: {
        id: inventoryBookWithOnlyAuthor2.id
      }
    })
    expect(deletedInventory2.isDeleted).toBe(true);
  })

  it("should not mark as deleted inventories for book where the other authors are not deleted", async() => {
    const notDeletedInventory = await prisma.inventory.findUnique({
      where: {
        id: inventoryBookWithSeveralAuthors.id
      }
    })
    expect(notDeletedInventory.isDeleted).toBe(false);
  })

  it("should mark as deleted payments for this author", async(req, res) => {
    const deletedPayment = await prisma.payment.findUnique({
      where: {
        id: paymentNewAuthor.id
      }
    })
    expect(deletedPayment.isDeleted).toBe(true);
  })

  it("should not mark as deleted payments for authors of books where he's not the only author", async(req, res) => {
    const notDeletedPayment = await prisma.payment.findUnique({
      where: {
        id: paymentNewAuthor2.id
      }
    })
    expect(notDeletedPayment.isDeleted).toBe(false);
  })

  it("should marked as deleted sales tied to his book where he's the only author", async(req, res) =>  {
    const deletedSale = await prisma.sale.findUnique({
      where: {
        id: saleInventoryBookWithOnlyAuthor1.id
      }
    })
    expect(deletedSale.isDeleted).toBe(true);

    const deletedSale2 = await prisma.sale.findUnique({
      where: {
        id: saleInventoryBookWithOnlyAuthor2.id
      }
    })
    expect(deletedSale2.isDeleted).toBe(true);
  })

  it("should not mark as deleted sales tied to his book where there's several authors", async(req, res) => {
    const notDeletedSale = await prisma.sale.findUnique({
      where: {
        id: saleInventoryBookWithSeveralAuthors.id
      }
    })
    expect(notDeletedSale.isDeleted).toBe(false);
  })

  it("should mark as deleted kindle sales tied to his book where he's the only author", async(req, res) => {
    const deletedKindleSale = await prisma.kindleSale.findUnique({
      where: {
        id: kindleSaleBookWithOnlyAuthor.id
      }
    })
    expect(deletedKindleSale.isDeleted).toBe(true)
  })

  it("should not mark as deleted kindle sales tied to his book where he's the not only author", async(req, res) => {
    const notDeletedKindleSale = await prisma.kindleSale.findUnique({
      where: {
        id: kindleSaleBookWithSeveralAuthors.id
      }
    })
    expect(notDeletedKindleSale.isDeleted).toBe(false)
  })

  it("should mark as deleted costs tied to deleted books", async(req, res) => {
    const deletedCost = await prisma.cost.findUnique({
      where: {
        id: costBookWithOnlyAuthor1.id
      }
    })
    expect(deletedCost.isDeleted).toBe(true);

    const deletedCost2 = await prisma.cost.findUnique({
      where: {
        id: costBookWithOnlyAuthor2.id
      }
    })
    expect(deletedCost2.isDeleted).toBe(true);
  })

  it("should not mark as deleted costs tied to not deleted books", async(req, res) => {
    const deletedCost = await prisma.cost.findUnique({
      where: {
        id: costBookWithSeveralAuthors1.id
      }
    })
    expect(deletedCost.isDeleted).toBe(false);

    const deletedCost2 = await prisma.cost.findUnique({
      where: {
        id: costBookWithSeveralAuthors2.id
      }
    })
    expect(deletedCost2.isDeleted).toBe(false);
  })
})


describe('deleting an author with invalid parameters', () => {
  let newAuthor, mockReq, mockRes, mute;

  beforeAll(async() => {
    newAuthor = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Author",
        email: "new.author@gmail.com",
        role: "author"
      }
    });

    mockReq = {
      params: {
        "id": "thisisanid"
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  let deletedAuthor;

  afterAll(async () => {
    mute.mockRestore();
  });

  it("should return status 500", async() => {
    await deleteAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not mark the author as deleted in the database", async() => {
    expect(newAuthor.isDeleted).toBe(false);
  })
})