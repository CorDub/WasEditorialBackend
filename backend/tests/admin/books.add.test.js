import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addBook, addMultipleBooks } from "../../routes/adminRoutes.js";
import {
  createAuthor,
  createBook,
  createTestDB,
  dropTestDB,
  createCategory,
  createBookstore
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let category1;
let author1, author2;
let wasBookstore;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  author1 = await createAuthor(prisma);
  author2 = await createAuthor(prisma);
  wasBookstore = await createBookstore(prisma, {name: "Plataforma Was"});
})

afterAll(async() => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
  dropTestDB(testDBName);
})



//ADDING
describe("adding a valid book", () => {
  let addedBook, addedImpression, addedInventory, mockReq, mockRes;

  beforeAll(async() => {
    mockReq = {
      body: {
        "title": "Yep this is a new book",
        "pasta": "Blanda",
        "price": 499.99,
        "isbn": "9786075987412",
        "quantity": 1000,
        "authors": [author1.id, author2.id],
        "category": category1.id
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should return status 201 and return json with title", async() => {
    await addBook(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "title": "Yep this is a new book",
    })
  })

  it("should create a new book in the database", async() => {
    addedBook = await prisma.book.findUnique({where: {title: "Yep this is a new book"}})
    expect(addedBook).toBeTruthy();
  })

  it("should have correct data", async() => {
    expect(addedBook.title).toBe("Yep this is a new book");
    expect(addedBook.pasta).toBe("Blanda");
    expect(addedBook.isbn).toBe("9786075987412");
  })

  it("should create a new impression in the database with the given quantity", async() => {
    addedImpression = await prisma.impression.findMany({where: {bookId: addedBook.id}});
    expect(addedImpression).toBeTruthy();
    expect(addedImpression.length).toBe(1);
    expect(addedImpression[0].quantity).toBe(1000);
  })

  it("should create a new inventory for Bodega Was in the database with the given quantity", async() => {
    addedInventory = await prisma.inventory.findMany({
      where: {
        bookId: addedBook.id
      },
      include: {
        bookstore: true
      }
    });
    expect(addedInventory).toBeTruthy();
    expect(addedInventory.length).toBe(1);
    expect(addedInventory[0].bookstore.name).toBe("Plataforma Was")
    expect(addedInventory[0].initial).toBe(1000);
    expect(addedInventory[0].current).toBe(1000);
    expect(addedInventory[0].bookstoreId).toBe(1);
    expect(addedInventory[0].price).toBe(499.99)
  })
})


describe("adding an invalid book", () => {
  let mockReq, mockRes, mute;
  let addedBook, addedImpression, addedInventory;

  beforeAll(async() => {
    mockReq = {
      body: {
        'title': "",
        "pasta": "Blanda",
        "price": 499.99,
        "isbn": "9786075987411",
        "quantity": 1000,
        "authors": [152, 13],
      },
      prisma: prisma
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  it("should return status 500", async() => {
    await addBook(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new book in the database", async() => {
    addedBook = await prisma.book.findUnique({where: {isbn: "9786075987411"}})
    expect(addedBook).toBeFalsy();
  })

  it("should not create a new impression in the database with the given quantity", async() => {
    if (addedBook) {
      addedImpression = await prisma.impression.findMany({where: {bookId: addedBook.id}});
    }
    expect(addedImpression).toBeFalsy();
  })

  it("should not create a new inventory for Bodega Was in the database with the given quantity", async() => {
    if (addedBook) {
      addedInventory = await prisma.inventory.findMany({where: {bookId: addedBook.id}});
    }
    expect(addedInventory).toBeFalsy;
  })

  afterAll(async() => {
    mute.mockRestore();
  })
})


describe("adding a duplicate book", async() => {
  let addedBook, addedImpression, addedInventory, previousBook, newAuthor, mockReq, mockRes, mute;
  let addedImpressionPreviousBook, addedInventoryPreviousBook;

  beforeAll(async() => {
    previousBook = await prisma.book.findUnique({where: {title: "Yep this is a new book"}});
    addedInventoryPreviousBook = await prisma.inventory.findMany({where: {bookId: previousBook.id}})[0];
    addedImpressionPreviousBook = await prisma.impression.findMany({where: {bookId: previousBook.id}})[0];

    mockReq = {
      body: {
        "title": "Yep this is a new book",
        "pasta": "Blanda",
        "price": 499.99,
        "isbn": "9786075987412",
        "quantity": 1000,
        "authors": [author1.id, author2.id],
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("should return status 500", async() => {
    await addBook(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new book in the database", async() => {
    addedBook = await prisma.book.findUnique({where: {isbn: "9786075987412"}})
    expect(addedBook.id).toBe(previousBook.id);
  })

  it("should not create a new impression in the database with the given quantity", async() => {
    const addedImpressions = await prisma.impression.findMany({});
    expect(addedImpressions.length).toBe(1)
  })

  it("should not create a new inventory for Bodega Was in the database with the given quantity", async() => {
    const bodegaWasInventories = await prisma.inventory.findMany({where: {bookstoreId: 1}})
    expect(bodegaWasInventories.length).toBe(1);
  })

  afterAll(async() => {
    mute.mockRestore();
  })
})