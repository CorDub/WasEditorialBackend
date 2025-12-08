import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateSale } from "../../routes/adminRoutes.js";
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



///UPDATING
describe(`updating a sale with valid parameters`, async() => {
  let mockReq, mockRes;
  let updatedSale, updatedInventory;
  let author;
  let book;
  let bookstore;
  let inventory;
  let payment;
  let sale;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    bookstore = await createBookstore(prisma);
    inventory = await createInventory(prisma, book.id, bookstore.id, {initial: 3000, current: 3000});
    payment = await createPayment(prisma, author.id, "2025-11");
    sale = await createSale(prisma, inventory.id, [payment.id], {quantity: 100})

    mockReq = {
      params: {
        "id": sale.id
      },
      body: {
        book: book.id,
        bookstore: bookstore.id,
        quantity: 20,
        date: new Date("2025-09-04")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should update the sale with the correct data`, async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: sale.id}, include: {payments: true}});
    updatedInventory = await prisma.inventory.findUnique({where: {id: inventory.id}})
    expect(updatedSale.id).toBe(sale.id);
    expect(updatedSale.inventoryId).toBe(updatedInventory.id);
    expect(updatedSale.quantity).toBe(20);
    expect(updatedSale.date).toStrictEqual(new Date("2025-09-04"));
  })

  it(`should update the inventory current`, async() => {
    expect(updatedInventory.current).toBe(3080);
  })

  it(`should change the payment it's tied to`, async() => {
    for (const payment of updatedSale.payments) {
      try {
        expect(payment.forMonth).toBe("2025-09");
      } catch(error) {
        console.log(`there was an error with payment ${payment.id}`)
        throw error
      }
    }
  })
})



describe(`updating the date of a valid sale for a book with multiple authors`, async() => {
  let mockReq, mockRes;
  let author1, author2, author3, author4;
  let book1;
  let bookstore1;
  let inventory1;
  let oldPayment1, oldPayment2, oldPayment3, oldPayment4;
  let newPayment1, newPayment2, newPayment3;
  let sale1;
  let updatedSale, updatedInventory, recreatedPayment, createdPayment;
  
  beforeAll(async() => {
    author1 = await createAuthor(prisma);
    author2 = await createAuthor(prisma);
    author3 = await createAuthor(prisma);
    author4 = await createAuthor(prisma);
    book1 = await createBook(prisma, [author1.id, author2.id, author3.id, author4.id]);
    bookstore1 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, book1.id, bookstore1.id, {initial: 1000, current: 900});
    oldPayment1 = await createPayment(prisma, author1.id, "2025-11")
    oldPayment2 = await createPayment(prisma, author2.id, "2025-11")
    oldPayment3 = await createPayment(prisma, author3.id, "2025-11")
    oldPayment4 = await createPayment(prisma, author4.id, "2025-11")
    newPayment1 = await createPayment(prisma, author1.id, "2025-09")
    newPayment2 = await createPayment(prisma, author2.id, "2025-09")
    newPayment3 = await createPayment(prisma, author3.id, "2025-09", {isDeleted: true})
    sale1 = await createSale(prisma, inventory1.id, [oldPayment1.id, oldPayment2.id, oldPayment4.id, oldPayment3.id], {quantity: 100, date: new Date("2025-11-02")})

    mockReq = {
      params: {
        "id": sale1.id
      },
      body: {
        "book": book1.id,
        "bookstore": bookstore1.id,
        "quantity": 100,
        "date": new Date("2025-09-04"),
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should update the sale with the correct data`, async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: sale1.id}, include: {payments: true}});
    updatedInventory = await prisma.inventory.findUnique({where: {id: inventory1.id}})
    expect(updatedSale.id).toBe(sale1.id);
    expect(updatedSale.inventoryId).toBe(updatedInventory.id);
    expect(updatedSale.quantity).toBe(100);
    expect(updatedSale.date).toStrictEqual(new Date("2025-09-04"));
  })

  it(`should update the inventory current`, async() => {
    expect(updatedInventory.current).toBe(900);
  })

  it(`should change all the payments it's tied to`, async() => {
    expect(updatedSale.payments.length).toBe(4)
    for (const payment of updatedSale.payments) {
      try {
        expect(payment.forMonth).toBe("2025-09");
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
          userId: author4.id,
          forMonth: "2025-09"
        }
      }
    });
    expect(createdPayment).toBeTruthy();
  })

  it(`should delete the payment and create a new one if it was marked deleted`, async() => {
    recreatedPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: author3.id,
          forMonth: "2025-09"
        }
      }
    });
    expect(recreatedPayment).toBeTruthy();
    expect(recreatedPayment.id).not.toBe(newPayment3.id);
  })
})



describe(`updating a sale with a larger quantity than what's remaining`, async() => {
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;
  let author;
  let book;
  let payment;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    payment = await createPayment(prisma, author.id, "2025-11");
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, book.id, newBookstore100.id , {initial: 3000, current: 100})
    newSale100 = await createSale(prisma, newInventory100.id, [payment.id], {quantity: 100});

    mockReq = {
      params: {
        "id": newSale100.id
      },
      body: {
        "book": book.id,
        "bookstore": newBookstore100.id,
        "quantity": 500,
        "date": new Date(),
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`shouldn't let you update the sale if the new quantity is higher than available in inventory`, async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: newSale100.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})



describe("updating a sale tied to a deleted inventory", async() => {
  let mockReq, mockRes, mute;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;
  let author;
  let book;
  let payment;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    payment = await createPayment(prisma, author.id, "2025-11")
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, book.id, newBookstore100.id, {initial: 3000, current: 100, isDeleted: true})
    newSale100 = await createSale(prisma, newInventory100.id, [payment.id], {quantity: 100});

    mockReq = {
      params: {
        "id": newSale100.id
      },
      body: {
        "book": book.id,
        "bookstore": newBookstore100.id,
        "quantity": 150,
        "date": new Date(),
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

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("shouldn't let you update the sale and inventory", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: newSale100.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})



describe(`updating a deleted sale`, async() => {
  let mockReq, mockRes, mute;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;
  let author;
  let book;
  let payment;

  beforeAll(async() => {
    author = await createAuthor(prisma);
    book = await createBook(prisma, [author.id]);
    payment = await createPayment(prisma, author.id, "2025-11")
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, book.id, newBookstore100.id, {initial: 3000, current: 100, isDeleted: true})
    newSale100 = await createSale(prisma, newInventory100.id, [payment.id], {quantity: 100, isDeleted: true});

    mockReq = {
      params: {
        "id": newSale100.id
      },
      body: {
        "book": book.id,
        "bookstore": newBookstore100.id,
        "quantity": 150,
        "date": new Date(),
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

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("shouldn't let you update the sale and inventory", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: newSale100.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})



describe(`updating the date of a sale but the corresponding payment 
is either paid or solicited`, async() => {
  let mockReq, mockRes;
  let author;
  let book;
  let bookstore;
  let inventory;
  let payment1, payment2, payment3, payment4;
  let sale;

  beforeAll(async() => {
    author = await createAuthor(prisma)
    book = await createBook(prisma, [author.id])
    bookstore = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    payment1 = await createPayment(prisma, author.id, "2025-06", {status: "paid"})
    payment2 = await createPayment(prisma, author.id, "2025-07", {status: "solicited"})
    payment3 = await createPayment(prisma, author.id, "2025-08", {status: "solicited"})
    payment4 = await createPayment(prisma, author.id, "2025-09", {status: "created"})
    sale = await createSale(prisma, inventory.id, [payment2.id], {date: new Date("2025-07-20")})

    mockReq = {
      params: {
        id: sale.id
      }, 
      body: {
        book: book.id,
        bookstore: bookstore.id,
        quantity: 10,
        date: new Date("2025-06-20")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should reassign the date to the nearest available payment (payment4)`, async() => {
    await updateSale(mockReq, mockRes);
    const reassignedSale = await prisma.sale.findUnique({where: {id: sale.id}, include: {payments: true}})
    expect(reassignedSale.date).toEqual(new Date("2025-06-20"))
    expect(reassignedSale.payments.length).toBe(1)
    expect(reassignedSale.payments[0].id).toBe(payment4.id)
  })
})



describe(`updating the date of a multi-payment sale but the corresponding payments 
are either paid or solicited`, async() => {
  let mockReq, mockRes;
  let author1, author2;
  let book;
  let bookstore;
  let inventory;
  let payment1, payment2, payment3, payment4, payment5, payment6, payment7;
  let sale;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book = await createBook(prisma, [author1.id, author2.id])
    bookstore = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    payment1 = await createPayment(prisma, author1.id, "2025-06", {status: "paid"})
    payment2 = await createPayment(prisma, author1.id, "2025-07", {status: "solicited"})
    payment3 = await createPayment(prisma, author1.id, "2025-08", {status: "solicited"})
    payment4 = await createPayment(prisma, author1.id, "2025-09", {status: "created"})
    payment5 = await createPayment(prisma, author2.id, "2025-06", {status: "paid"})
    payment6 = await createPayment(prisma, author2.id, "2025-07", {status: "solicited"})
    payment7 = await createPayment(prisma, author2.id, "2025-08", {status: "created"})
    sale = await createSale(prisma, inventory.id, [payment2.id], {date: new Date("2025-07-20")})

    mockReq = {
      params: {
        id: sale.id
      }, 
      body: {
        book: book.id,
        bookstore: bookstore.id,
        quantity: 10,
        date: new Date("2025-06-20")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should reassign the date to the nearest available payment for each author`, async() => {
    await updateSale(mockReq, mockRes);
    const reassignedSale = await prisma.sale.findUnique({where: {id: sale.id}, include: {payments: true}})
    expect(reassignedSale.date).toEqual(new Date("2025-06-20"))
    expect(reassignedSale.payments.length).toBe(2)
    
    let reassignedPayments = []
    for (const payment of reassignedSale.payments) {
      reassignedPayments.push(payment.id)
    }
    expect(reassignedPayments).toContain(payment4.id)
    expect(reassignedPayments).toContain(payment7.id)
  })
})



describe(`updating the date of a multi-payment sale but the reassignable payments
are all paid or solicited`, async() => {
  let mockReq, mockRes;
  let author1, author2;
  let book;
  let bookstore;
  let inventory;
  let payment1, payment2, payment3, payment5, payment6;
  let sale;

  beforeAll(async() => {
    author1 = await createAuthor(prisma)
    author2 = await createAuthor(prisma)
    book = await createBook(prisma, [author1.id, author2.id])
    bookstore = await createBookstore(prisma)
    inventory = await createInventory(prisma, book.id, bookstore.id)
    payment1 = await createPayment(prisma, author1.id, "2025-06", {status: "paid"})
    payment2 = await createPayment(prisma, author1.id, "2025-07", {status: "solicited"})
    payment3 = await createPayment(prisma, author1.id, "2025-08", {status: "solicited"})
    payment5 = await createPayment(prisma, author2.id, "2025-06", {status: "paid"})
    payment6 = await createPayment(prisma, author2.id, "2025-07", {status: "solicited"})
    sale = await createSale(prisma, inventory.id, [payment2.id], {date: new Date("2025-07-20")})

    mockReq = {
      params: {
        id: sale.id
      }, 
      body: {
        book: book.id,
        bookstore: bookstore.id,
        quantity: 10,
        date: new Date("2025-06-20")
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should create a new payment at the nearest available date in the future`, async() => {
    await updateSale(mockReq, mockRes);
    const reassignedSale = await prisma.sale.findUnique({where: {id: sale.id}, include: {payments: true}})
    expect(reassignedSale.date).toEqual(new Date("2025-06-20"))
    expect(reassignedSale.payments.length).toBe(2)
    
    const author1Payment = reassignedSale.payments.find(payment => 
      payment.userId === author1.id
      && payment.forMonth === "2025-09" 
      && payment.status === "created")
    expect(author1Payment).toBeTruthy();

    const author2Payment = reassignedSale.payments.find(payment => 
      payment.userId === author2.id
      && payment.forMonth === "2025-08" 
      && payment.status === "created")
    expect(author2Payment).toBeTruthy();
  })
})