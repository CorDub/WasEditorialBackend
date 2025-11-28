import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getSales, addSale, updateSale, deleteSale } from "../../routes/adminRoutes.js";
import { prisma } from "../../prisma/client.js";
import { getForMonth } from "../../utils.js"
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
  deleteFromDB ,
  createTestDB,
  dropTestDB
} from "../../testUtils.js";


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


async function seed() {
  let newAuthor = await createAuthor(prisma);

  let newBook = await createBook(prisma, [newAuthor.id]);
  let newBook2 = await createBook(prisma, [newAuthor.id]);
  let newBook3 = await createBook(prisma, [newAuthor.id]);
  let newBook4 = await createBook(prisma, [newAuthor.id]);
  let newBook5 = await createBook(prisma, [newAuthor.id]);

  let deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});

  let newImpression = await createImpression(prisma, newBook.id, {quantity: 1000, note: "this is the note", date: new Date("2025-10-29")});
  let newImpression2 = await createImpression(prisma, newBook.id, {quantity: 1000});
  let newImpression3 = await createImpression(prisma, newBook.id, {quantity: 1000});
  let deletedImpression = await createImpression(prisma, newBook.id, {quantity: 100, isDeleted: true});

  let newBookstore = await createBookstore(prisma);
  let newBookstore2 = await createBookstore(prisma);
  let newBookstore3 = await createBookstore(prisma);
  let newBookstore4 = await createBookstore(prisma);
  let deletedBookstore = await createBookstore(prisma, {isDeleted: true});

  let deletedInventory = await createInventory(prisma, newBook2.id, newBookstore.id, {initial: 1000, current: 1000, isDeleted: true});
  let newInventory = await createInventory(prisma, newBook.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 0, givenToAuthor: 0});
  let newInventory2 = await createInventory(prisma, newBook.id, newBookstore2.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory3 = await createInventory(prisma, newBook.id, newBookstore3.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory4 = await createInventory(prisma, newBook.id, newBookstore4.id, {initial: 3000, current: 3000, isDeleted: true, returns: 0, givenToAuthor: 0});
  let newInventory5 = await createInventory(prisma, newBook3.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory6 = await createInventory(prisma, newBook4.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: false, returns: 10, givenToAuthor:  10});
  let newInventory7 = await createInventory(prisma, newBook5.id, newBookstore.id, {initial: 3000, current: 3000, isDeleted: true, returns: 10, givenToAuthor: 10});
  let newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2025-11-02")));
  let previousPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2025-09-02")));
  let oldPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date("2024-01-01")));

  let deletedSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
  let newSale1 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
  let newSale2 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100});
  let newSale3 = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, isDeleted: true});
  let newSale4 = await createSale(prisma, newInventory2.id, [newPayment.id], {quantity: 100});
  let oldSale = await createSale(prisma, newInventory.id, [newPayment.id], {quantity: 100, date: new Date("2024-01-01")});

  const testDBObjects = {
    newAuthor:       { type: "author", data: newAuthor },

    newBook:         { type: "book", data: newBook },
    newBook2:        { type: "book", data: newBook2 },
    newBook3:        { type: "book", data: newBook3 },
    newBook4:        { type: "book", data: newBook4 },
    newBook5:        { type: "book", data: newBook5 },

    deletedBook:     { type: "book", data: deletedBook },

    newImpression:   { type: "impression", data: newImpression },
    newImpression2:  { type: "impression", data: newImpression2 },
    newImpression3:  { type: "impression", data: newImpression3 },
    deletedImpression:{ type: "impression", data: deletedImpression },

    newBookstore:    { type: "bookstore", data: newBookstore },
    newBookstore2:   { type: "bookstore", data: newBookstore2 },
    newBookstore3:   { type: "bookstore", data: newBookstore3 },
    newBookstore4:   { type: "bookstore", data: newBookstore4 },
    deletedBookstore:{ type: "bookstore", data: deletedBookstore },

    deletedInventory:{ type: "inventory", data: deletedInventory },
    newInventory:    { type: "inventory", data: newInventory },
    newInventory2:   { type: "inventory", data: newInventory2 },
    newInventory3:   { type: "inventory", data: newInventory3 },
    newInventory4:   { type: "inventory", data: newInventory4 },
    newInventory5:   { type: "inventory", data: newInventory5 },
    newInventory6:   { type: "inventory", data: newInventory6 },
    newInventory7:   { type: "inventory", data: newInventory7 },

    newPayment:      { type: "payment", data: newPayment },
    previousPayment: { type: "payment", data: previousPayment},
    oldPayment:      { type: "payment", data: oldPayment },
 
    deletedSale:     { type: "sale", data: deletedSale },
    newSale1:        { type: "sale", data: newSale1 },
    newSale2:        { type: "sale", data: newSale2 },
    newSale3:        { type: "sale", data: newSale3 },
    newSale4:        { type: "sale", data: newSale4 },
    oldSale:         { type: "sale", data: oldSale },
  };
  return testDBObjects
}

async function reap(testDBObjects) {
  const deletionList = [
    "oldSale", "newSale1", "newSale2", "newSale3", "newSale4", "deletedSale",
    "oldPayment", "previousPayment", "newPayment", "deletedPayment",
    'newInventory8', "newInventory7", "newInventory6", "newInventory5", "newInventory4",
    "newInventory3", "newInventory2", "newInventory", "deletedInventory",
    "deletedBookstore", "newBookstore4", "newBookstore3", "newBookstore2",
    "newBookstore",
    "deletedImpression", "newImpression3", "newImpression2", "newImpression",
    "deletedBook", "newBook6", "newBook5", "newBook4", "newBook3", "newBook2", "newBook",
    "newAuthor2", "newAuthor", 
  ];
  for (const item of deletionList) {
    const obj = testDBObjects[item];
    if (!obj) continue;
    await deleteFromDB(prisma, obj.data, obj.type);
    // console.log(`deleted ${obj.type}`);
  }
}

///GETTING
describe("getting all valid sales", () => {
  let testDBObjects;
  let mockReq, mockRes, jsonResponse;

  beforeAll(async() => {
    testDBObjects = await seed();

    mockReq = {
      query: {
        startDate: "2024-11-03",
        endDate: "2025-11-03"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await reap(testDBObjects);
  })

  it("should return a 200 status", async() => {
    await getSales(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a salesCompiled array with keys forMonth, sales, total, 
  bookstores, books, authors`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0];
    expect(Array.isArray(jsonResponse)).toBe(true)
    const keys = ["forMonth", "sales", "total", 'bookstores', "books", "authors"];
    expect(Object.keys(jsonResponse[0])).toEqual(keys);
  })

  it(`should not include sales outside of its date range`, async() => {
    for (const month of jsonResponse) {
      try {
        expect(month.sales).not.toContainEqual(testDBObjects.oldSale.data);
      } catch (error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })

  it(`should not include deleted sales`, async() => {
    for (const month of jsonResponse) {
      try {
        expect(month.sales).not.toContainEqual(testDBObjects.deletedSale.data);
      } catch (error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })

  it(`should correctly sum up the total quantity of sales each month`, async() => {
    for (const month of jsonResponse) {
      try {
        let total = 0;
        for (const sale of month.sales) {
          total += sale.quantity
        };
        expect(total).toBe(month.total);
      } catch(error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })

  it(`should correctly list the books sold`, async() => {
    for (const month of jsonResponse) {
      try {
        let books = [];
        for (const sale of month.sales) {
          if (!books.includes(sale.inventory.book.title)) {
            books.push(sale.inventory.book.title)
          }
        };
        expect(books.sort()).toEqual(month.books.sort());
      } catch(error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })

  it(`should correctly list the bookstores where the sales happened`, async() => {
    for (const month of jsonResponse) {
      try {
        let bookstores = [];
        for (const sale of month.sales) {
          if (!bookstores.includes(sale.inventory.bookstore.name)) {
            bookstores.push(sale.inventory.bookstore.name)
          }
        };
        expect(bookstores.sort()).toEqual(month.bookstores.sort());
      } catch(error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })

  it(`should correctly list the authors associated with the sales`, async() => {
    for (const month of jsonResponse) {
      try {
        let authors = [];
        for (const sale of month.sales) {
          sale.inventory.book.users.map((user) => {
            const fullName = user.first_name + ' ' + user.last_name;
            if (!authors.includes(fullName)) {
              authors.push(fullName)
            }
          })
        };
        expect(authors.sort()).toEqual(month.authors.sort());
      } catch(error) {
        console.log(`Issue detected at ${month}`);
        throw error
      }
    }
  })
})



describe("adding a valid sale", () => {
  let testDBObjects, createdSale;
  let mockReq, mockRes;
  let createdPayment, invCreatedSale;

  beforeAll(async() => {
    testDBObjects = await seed();
    mockReq = {
      body: {
        "bookId": testDBObjects.newBook.data.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, createdPayment, "payment");
    await reap(testDBObjects);
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it(`should create a sale in the database`, async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it(`should create a new Payment if no payments exist for this specific month`, async() => {
    createdPayment = await prisma.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth(new Date("2024-11-22"))
        }
      }
    })
    expect(createdPayment).toBeTruthy();
  })

  it(`should have correct data`, async() => {
    invCreatedSale = await prisma.inventory.findUnique({
      where: {
        bookId_bookstoreId: {
          bookId: testDBObjects.newBook.data.id,
          bookstoreId: testDBObjects.newBookstore.data.id
        }
      }
    })

    expect(createdSale.inventoryId).toBe(invCreatedSale.id);
    expect(createdSale.quantity).toBe(100);
    expect(createdSale.date).toEqual(new Date("2024-11-22"));
  })

  it(`should update the inventory tied to the sale`, async() => {
    expect(invCreatedSale.current).toBe(2900);
  })
})


describe("adding a sale for a multi-authors book", async() => {
  let testDBObjects, createdSale;
  let mockReq, mockRes;
  let newAuthor2, newBook6, newInventory8;
  let newPayments;

  beforeAll(async() => {
    newAuthor2 = await createAuthor(prisma);
    testDBObjects = await seed();
    newBook6 = await createBook(prisma, [testDBObjects.newAuthor.data.id, newAuthor2.id]);
    newInventory8 = await createInventory(prisma, newBook6.id, testDBObjects.newBookstore.data.id, {initial: 3000, current: 3000});

    mockReq = {
      body: {
        "bookId": newBook6.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, newPayments[0], "payment");
    await deleteFromDB(prisma, newPayments[1], "payment");
    await deleteFromDB(prisma, newInventory8, "inventory");
    await deleteFromDB(prisma, newBook6, "book");
    await deleteFromDB(prisma, newAuthor2, "author")
    await reap(testDBObjects);
  })

  it(`should create a new Payment for every author of the book if it does not exist`, async() => {
    await addSale(mockReq, mockRes)
    createdSale = mockRes.json.mock.calls[0][0]
    newPayments = await prisma.payment.findMany({
      where: {
        userId: {
          in: [testDBObjects.newAuthor.data.id, newAuthor2.id]
        },
        forMonth: "2024-11"
      }
    });

    expect(newPayments.length).toBe(2);
    expect(createdSale.payments[0].id).toEqual(newPayments[0].id);
    expect(createdSale.payments[1].id).toEqual(newPayments[1].id);
  })
})


describe("adding a sale larger than the remaining inventory", async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let createdSale, createdPayment;
  let newAuthor2, newBook6, newInventory9;

  beforeAll(async() => {
    newAuthor2 = await createAuthor(prisma);
    testDBObjects = await seed();
    newBook6 = await createBook(prisma, [testDBObjects.newAuthor.data.id, newAuthor2.id]);
    newInventory9 = await createInventory(prisma, newBook6.id, testDBObjects.newBookstore2.data.id, {initial: 50, current:50});

    mockReq = {
      body: {
        "bookId": newBook6.id,
        "bookstoreId": testDBObjects.newBookstore2.data.id,
        "quantity": 100,
        "date": new Date("2024-11-22"),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdPayment, "payment");
    await deleteFromDB(prisma, newInventory9, "inventory");
    await deleteFromDB(prisma, newBook6, "book");
    await deleteFromDB(prisma, newAuthor2, "author")
    await reap(testDBObjects);
  })

  it(`should not create a new sale if the inventory doesn't have enough books`, async() => {
    await addSale(mockReq, mockRes)
    createdSale = mockRes.json.mock.calls[0][0];
    createdPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    });

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(createdSale).toEqual({ message: "El inventario tiene menos libros disponibles que la cantidad entrada."})
  })
})



describe("adding a sale but the payment is deleted", async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let createdSale, createdPayment, oldPayment;
  let deletedPayment;

  beforeAll(async() => {
    testDBObjects = await seed();
    deletedPayment = await createPayment(
      prisma, 
      testDBObjects.newAuthor.data.id, 
      getForMonth(new Date("2025-10-04")), 
      {isDeleted: true}
    );

    mockReq = {
      body: {
        "bookId": testDBObjects.newBook.data.id,
        "bookstoreId": testDBObjects.newBookstore.data.id,
        "quantity": 100,
        "date": new Date("2025-10-04"),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    oldPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    })
  })

  afterAll(async() => {
    await deleteFromDB(prisma, createdSale, "sale");
    await deleteFromDB(prisma, createdPayment, "payment");
    // await deleteFromDB(prisma, deletedPayment, "payment");
    await reap(testDBObjects);
  })

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })

  it(`should create a sale in the database`, async() => {
    createdSale = mockRes.json.mock.calls[0][0];
    expect(createdSale).toBeTruthy();
  })

  it(`should destroy and recreate the payment`, async() => {
    expect(oldPayment.isDeleted).toBe(true);
    createdPayment = await prisma.payment.findUnique({
      where:{
        userId_forMonth: {
          userId: testDBObjects.newAuthor.data.id,
          forMonth: getForMonth("2025-10-04")
        }
      }
    });
    expect(createdPayment.isDeleted).toBe(false);
  })
})

///UPDATING
describe(`updating a sale with valid parameters`, async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      body: {
        "book": testDBObjects.newBook.data.id,
        "bookstore": testDBObjects.newBookstore.data.id,
        "quantity": 20,
        "date": new Date("2025-09-04"),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    // await deleteFromDB(prisma, updatedSale, "sale");
    // await deleteFromDB(prisma, updatedInventory, "inventory");
    await reap(testDBObjects);
  })

  it(`should return a status 200`, async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should update the sale with the correct data`, async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}, include: {payments: true}});
    updatedInventory = await prisma.inventory.findUnique({where: {id: testDBObjects.newInventory.data.id}})
    expect(updatedSale.id).toBe(testDBObjects.newSale1.data.id);
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, sale1, "sale");
    await deleteFromDB(prisma, oldPayment1, "payment");
    await deleteFromDB(prisma, oldPayment2, "payment");
    await deleteFromDB(prisma, oldPayment3, "payment");
    await deleteFromDB(prisma, oldPayment4, "payment");
    await deleteFromDB(prisma, newPayment1, "payment");
    await deleteFromDB(prisma, newPayment2, "payment");
    await deleteFromDB(prisma, recreatedPayment, "payment");
    await deleteFromDB(prisma, createdPayment, "payment");
    await deleteFromDB(prisma, inventory1, "inventory");
    await deleteFromDB(prisma, bookstore1, "bookstore");
    await deleteFromDB(prisma, book1, "book");
    await deleteFromDB(prisma, author1, "author");
    await deleteFromDB(prisma, author2, "author");
    await deleteFromDB(prisma, author3, "author");
    await deleteFromDB(prisma, author4, "author");
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
  let testDBObjects;
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, testDBObjects.newBook.data.id, newBookstore100.id , {initial: 3000, current: 100})
    newSale100 = await createSale(prisma, newInventory100.id, [testDBObjects.newPayment.data.id], {quantity: 100});

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      body: {
        "book": testDBObjects.newBook.data.id,
        "bookstore": newBookstore100.id,
        "quantity": 500,
        "date": new Date(),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newSale100, "sale");
    await deleteFromDB(prisma, newInventory100, "inventory");
    await deleteFromDB(prisma, newBookstore100, "bookstore")
    await reap(testDBObjects);
  })

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`shouldn't let you update the sale if the new quantity is higher than available in inventory`, async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})


describe("updating a sale tied to a deleted inventory", async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, testDBObjects.newBook.data.id, newBookstore100.id, {initial: 3000, current: 100, isDeleted: true})
    newSale100 = await createSale(prisma, newInventory100.id, [testDBObjects.newPayment.data.id], {quantity: 100});

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      body: {
        "book": testDBObjects.newBook.data.id,
        "bookstore": newBookstore100.id,
        "quantity": 150,
        "date": new Date(),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newSale100, "sale");
    await deleteFromDB(prisma, newInventory100, "inventory");
    await deleteFromDB(prisma, newBookstore100, "bookstore")
    await reap(testDBObjects);
  })

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("shouldn't let you update the sale and inventory", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})


describe(`updating a deleted sale`, async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, testDBObjects.newBook.data.id, newBookstore100.id, {initial: 3000, current: 100, isDeleted: true})
    newSale100 = await createSale(prisma, newInventory100.id, [testDBObjects.newPayment.data.id], {quantity: 100, isDeleted: true});

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      body: {
        "book": testDBObjects.newBook.data.id,
        "bookstore": newBookstore100.id,
        "quantity": 150,
        "date": new Date(),
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newSale100, "sale");
    await deleteFromDB(prisma, newInventory100, "inventory");
    await deleteFromDB(prisma, newBookstore100, "bookstore")
    await reap(testDBObjects);
  })

  it("should return a 400", async() => {
    await updateSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("shouldn't let you update the sale and inventory", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.quantity).toBe(100);
    expect(updatedInventory.current).toBe(100);
  })
})


/// DELETING
describe(`deleting a sale with valid parameters`, async() => {
  let testDBObjects;
  let mockReq, mockRes;
  let newSale100, newInventory100, newBookstore100;
  let updatedSale, updatedInventory;

  beforeAll(async() => {
    testDBObjects = await seed();
    newBookstore100 = await createBookstore(prisma);
    newInventory100 = await createInventory(prisma, testDBObjects.newBook.data.id, newBookstore100.id, {initial: 3000, current: 2900})
    newSale100 = await createSale(prisma, newInventory100.id, [testDBObjects.newPayment.data.id], {quantity: 100});

    mockReq = {
      params: {
        "id": testDBObjects.newSale1.data.id
      },
      query: {
        "inventory_id": newInventory100.id,
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newSale100, "sale");
    await deleteFromDB(prisma, newInventory100, "inventory");
    await deleteFromDB(prisma, newBookstore100, "bookstore")
    await reap(testDBObjects);
  })

  it("should return a 200", async() => {
    await deleteSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the sale as deleted", async() => {
    updatedSale = await prisma.sale.findUnique({where: {id: testDBObjects.newSale1.data.id}})
    updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory100.id}})
    expect(updatedSale.isDeleted).toBe(true);
    
  })

  it("should return the quantity to the current inventory", async() => {
    expect(updatedInventory.current).toBe(3000);
  })
})