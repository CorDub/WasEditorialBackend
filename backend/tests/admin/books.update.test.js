import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateBook, updateBookPrices } from "../../routes/adminRoutes.js";
import {
  createAuthor,
  createBook,
  createTestDB,
  dropTestDB,
  createCategory,
  createBookstore,
  createInventory
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


/// UPDATING
describe('updating a book with valid parameters', () => {
  let newAuthor, newBook, addedInventory, addedImpression, mockReq, mockRes;
  let updatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id])

    addedInventory = await prisma.inventory.findMany({where: {bookId: newBook.id}})[0];
    addedImpression = await prisma.impression.findMany({where: {bookId: newBook.id}})[0];

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "title": "Updated title",
        "pasta": "Dura",
        "isbn": null,
        "authors": [{"id": newAuthor.id}, {"id": 1}, {"id": 2}]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  it("should return status 200", async() => {
    await updateBook(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should update the book with the correct data in the database", async() => {
    updatedBook = await prisma.book.findUnique({
      where: {
        id: newBook.id
      },
      select:{  
        title: true,
        pasta: true,
        isbn: true,
        users: {
          select: {
            id: true
          }
        }
      }
    })
    expect(updatedBook).toBeTruthy();
    expect(updatedBook.title).toBe("Updated title");
    expect(updatedBook.pasta).toBe("Dura");
    expect(updatedBook.isbn).toBe(null);
    expect(updatedBook.users).toStrictEqual([{"id": 1}, {"id": 2}, {"id": newAuthor.id}])
  })
})


describe("updating a book with invalid parameters", () => {
  let newAuthor, newBook, addedInventory, addedImpression, mockReq, mockRes, mute;
  let notUpdatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id])
    addedInventory = await prisma.inventory.findMany({where: {bookId: newBook.id}})[0];
    addedImpression = await prisma.impression.findMany({where: {bookId: newBook.id}})[0];

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "title": "",
        "pasta": "",
        "isbn": null,
        "authors": [{"id": newAuthor.id}, {"id": 1}, {"id": 2}]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore();
  });

  it("should return status 500", async() => {
    await updateBook(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the book in the database", async() => {
    notUpdatedBook = await prisma.book.findUnique({where: {id: newBook.id}})
    expect(notUpdatedBook).toBeTruthy();
    expect(notUpdatedBook.title).toBe(newBook.title);
  })
})



describe("updating a deleted book", async() => {
  let newAuthor, deletedBook, addedInventory, addedImpression, mockReq, mockRes, mute;
  let notUpdatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true})

    addedInventory = await prisma.inventory.findMany({where: {bookId: deletedBook.id}})[0];
    addedImpression = await prisma.impression.findMany({where: {bookId: deletedBook.id}})[0];

    mockReq = {
      params: {
        "id": deletedBook.id
      },
      body: {
        "title": "",
        "pasta": "",
        "isbn": null,
        "authors": [{"id": newAuthor.id}, {"id": 1}, {"id": 2}]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore();
  });

  it("should return status 500", async() => {
    await updateBook(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the book in the database", async() => {
    notUpdatedBook = await prisma.book.findUnique({where: {id: deletedBook.id}})
    expect(notUpdatedBook).toBeTruthy();
    expect(notUpdatedBook.title).toBe(deletedBook.title);
  })
})



describe("updating prices for a given book", async() => {
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let updatedInventory1, updatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": 299.99
          }, 
          {
            "inventoryId": inventory2.id,
            "price": 349.99
          }
        ]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should respond with a status 200", async() => {
    await updateBookPrices(mockReq, mockRes, prisma) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  }) 

  it("should update the price for all inventories in the database", async() => {
    updatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(updatedInventory1.price).toBe(299.99)
    updatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(updatedInventory2.price).toBe(349.99)
  })
})



describe('updating prices for a book with invalid data', async() => {
  let mockReq, mockRes, mute;
  let newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id]);
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": "dos cientos noventa y nueve pesos"
          }, 
          {
            "inventoryId": inventory2.id,
            "price": -349.99
          }
        ]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => {mute.mockRestore()})

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes, prisma) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  }) 

  it("should not update the price for all inventories in the database", async() => {
    notUpdatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(notUpdatedInventory1.price).toBe(499.99)
    notUpdatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(notUpdatedInventory2.price).toBe(499.99)
  })
})



describe("updating prices for a deleted book", async() => {
  let mockReq, mockRes, mute;
  let newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);
    newBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
    bookstore1 = await createBookstore(prisma);
    bookstore2 = await createBookstore(prisma);
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, {initial: 1000, current: 1000});
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, {initial: 1000, current: 1000});

    mockReq = {
      params: {
        "id": newBook.id
      },
      body: {
        "prices" : [
          {
            "inventoryId": inventory1.id,
            "price": 249.99
          }, 
          {
            "inventoryId": inventory2.id,
            "price": 349.99
          }
        ]
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes, prisma) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  }) 

  it("should not update the price for all inventories in the database", async() => {
    notUpdatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(notUpdatedInventory1.price).toBe(499.99)
    notUpdatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(notUpdatedInventory2.price).toBe(499.99)
  })
})