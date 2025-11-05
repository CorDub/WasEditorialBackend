import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getBooks,
  getExistingBookTitles,
  addBook,
  addMultipleBooks,
  updateBook,
  updateBookPrices,
  deleteBook,
} from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import { getForMonth } from "../utils.js"
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
  deleteFromDB 
} from "../testUtils.js";

//GETTING
describe("getting all valid books", () => {
  let mockRes, deletedBook, newAuthor, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    deletedBook = await createBook(prisma, "deletedBook", [{"id": newAuthor.id}], true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    console.log("deletedBook", deletedBook);
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")}
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
  })

  it("should return a list of all valid books", async() => {
    await getBooks({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted authors", async() => {
    expect(jsonResponse.includes(deletedBook)).toBeFalsy()
  })
})


describe("getting all existing book titles", () => {
  let mockRes, deletedBook, newAuthor, jsonResponse;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    deletedBook = await createBook(prisma, "deletedBook", [{"id": newAuthor.id}], true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    console.log("deletedBook", deletedBook);
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")}
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
  })

  it("should return a list of all valid book titles", async() => {
    await getExistingBookTitles({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should only send out id, title and bookstoreId", async() => {
    expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "title", "inventories"]);
  })

  it("should not contain deleted authors", async() => {
    expect(jsonResponse.includes(deletedBook)).toBeFalsy()
  })
})


//ADDING
describe("adding a valid book", () => {
  let addedBook, addedImpression, addedInventory;

  const mockReq = {
    body: {
      "title": "Yep this is a new book",
      "pasta": "Blanda",
      "price": 499.99,
      "isbn": "9786075987411",
      "quantity": 1000,
      "authors": [152, 13],
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with title", async() => {
    await addBook(mockReq, mockRes);
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
    expect(addedBook.isbn).toBe("9786075987411");
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

  afterAll(async() => {
    if (addedInventory) {await deleteFromDB(prisma, addedInventory[0], "inventory")};
    if (addedImpression) {await deleteFromDB(prisma, addedImpression[0], "impression")};
    if (addedBook) {await deleteFromDB(prisma, addedBook, "book")};
  })
})


describe("adding an invalid book", () => {
  let addedBook, addedImpression, addedInventory;

  const mockReq = {
    body: {
      "title": "",
      "pasta": "Blanda",
      "price": 499.99,
      "isbn": "9786075987411",
      "quantity": 1000,
      "authors": [152, 13],
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 500", async() => {
    await addBook(mockReq, mockRes);
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
    if (addedInventory) {await deleteFromDB(prisma, addedInventory[0], "inventory")};
    if (addedImpression) {await deleteFromDB(prisma, addedImpression[0], "impression")};
    if (addedBook) {await deleteFromDB(prisma, addedBook, "book")};
  })
})


describe("adding a duplicate book", async() => {
  let addedBook, addedImpression, addedInventory, previousBook, newAuthor, mockReq, mockRes;
  let addedImpressionPreviousBook, addedInventoryPreviousBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    previousBook = await createBook(
      prisma, 
      'Yep this is a new book',
      [{'id': newAuthor.id}],
    )
    addedInventoryPreviousBook = await prisma.inventory.findMany({where: {bookId: previousBook.id}})[0];
    addedImpressionPreviousBook = await prisma.impression.findMany({where: {bookId: previousBook.id}})[0];

    mockReq = {
      body: {
        "title": "Yep this is a new book",
        "pasta": "Blanda",
        "price": 499.99,
        "isbn": "9786075987411",
        "quantity": 1000,
        "authors": [152, 13],
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should return status 500", async() => {
    await addBook(mockReq, mockRes);
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
    if (addedInventoryPreviousBook) {await deleteFromDB(prisma, addedInventoryPreviousBook[0], "inventory")};
    if (addedImpressionPreviousBook) {await deleteFromDB(prisma, addedImpressionPreviousBook[0], "impression")}
    if (previousBook) {await deleteFromDB(prisma, previousBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
    if (addedInventory) {await deleteFromDB(prisma, addedInventory[0], "inventory")};
    if (addedImpression) {await deleteFromDB(prisma, addedImpression[0], "impression")};
    if (addedBook) {await deleteFromDB(prisma, addedBook, "book")};
  })
})


/// UPDATING
describe('updating a book with valid parameters', () => {
  let newAuthor, newBook, addedInventory, addedImpression, mockReq, mockRes;
  let updatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(
      prisma, 
      'Yep this is a new book',
      [{'id': newAuthor.id}],
    )
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

  afterAll(async() => {
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
    if (addedImpression) {await deleteFromDB(prisma, addedImpression, "impression")}
    if (addedInventory) {await deleteFromDB(prisma, addedInventory, "inventory")}
    if (newBook) {await deleteFromDB(prisma, newBook, "book")}
  });

  it("should return status 200", async() => {
    await updateBook(mockReq, mockRes);
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
  let newAuthor, newBook, addedInventory, addedImpression, mockReq, mockRes;
  let notUpdatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(
      prisma, 
      'Yep this is a new book',
      [{'id': newAuthor.id}],
    )
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
  });

  afterAll(async() => {
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
    if (addedImpression) {await deleteFromDB(prisma, addedImpression, "impression")}
    if (addedInventory) {await deleteFromDB(prisma, addedInventory, "inventory")}
    if (newBook) {await deleteFromDB(prisma, newBook, "book")}
  });

  it("should return status 500", async() => {
    await updateBook(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the book in the database", async() => {
    notUpdatedBook = await prisma.book.findUnique({where: {id: newBook.id}})
    expect(notUpdatedBook).toBeTruthy();
    expect(notUpdatedBook.title).toBe("Yep this is a new book");
  })
})

describe("updating a deleted book", async() => {
  let newAuthor, deletedBook, addedInventory, addedImpression, mockReq, mockRes;
  let notUpdatedBook;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    deletedBook = await createBook(
      prisma, 
      'Yep this is a new book',
      [{'id': newAuthor.id}],
      true
    )
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
  });

  afterAll(async() => {
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
    if (addedImpression) {await deleteFromDB(prisma, addedImpression, "impression")}
    if (addedInventory) {await deleteFromDB(prisma, addedInventory, "inventory")}
    if (deletedBook) {await deleteFromDB(prisma, deletedBook, "book")}
  });

  it("should return status 500", async() => {
    await updateBook(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the book in the database", async() => {
    notUpdatedBook = await prisma.book.findUnique({where: {id: deletedBook.id}})
    expect(notUpdatedBook).toBeTruthy();
    expect(notUpdatedBook.title).toBe("Yep this is a new book");
  })
})


describe("updating prices for a given book", async() => {
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let updatedInventory1, updatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(prisma, "new book", [{"id": newAuthor.id}]);
    bookstore1 = await createBookstore(prisma, "bookstore1");
    bookstore2 = await createBookstore(prisma, "bookstore2");
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, 1000, 1000);
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, 1000, 1000);

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

  afterAll(async() => {
    if (inventory1) {await deleteFromDB(prisma, inventory1, "inventory")};
    if (inventory2) {await deleteFromDB(prisma, inventory2, "inventory")};
    if (bookstore1) {await deleteFromDB(prisma, bookstore1, "bookstore")};
    if (bookstore2) {await deleteFromDB(prisma, bookstore2, "bookstore")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should respond with a status 200", async() => {
    await updateBookPrices(mockReq, mockRes) 
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
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(prisma, "new book", [{"id": newAuthor.id}]);
    bookstore1 = await createBookstore(prisma, "bookstore1");
    bookstore2 = await createBookstore(prisma, "bookstore2");
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, 1000, 1000);
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, 1000, 1000);

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
  })

  afterAll(async() => {
    if (inventory1) {await deleteFromDB(prisma, inventory1, "inventory")};
    if (inventory2) {await deleteFromDB(prisma, inventory2, "inventory")};
    if (bookstore1) {await deleteFromDB(prisma, bookstore1, "bookstore")};
    if (bookstore2) {await deleteFromDB(prisma, bookstore2, "bookstore")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes) 
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
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let notUpdatedInventory1, notUpdatedInventory2;
  
  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(prisma, "new book", [{"id": newAuthor.id}], true);
    bookstore1 = await createBookstore(prisma, "bookstore1");
    bookstore2 = await createBookstore(prisma, "bookstore2");
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, 1000, 1000);
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, 1000, 1000);

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
  })

  afterAll(async() => {
    if (inventory1) {await deleteFromDB(prisma, inventory1, "inventory")};
    if (inventory2) {await deleteFromDB(prisma, inventory2, "inventory")};
    if (bookstore1) {await deleteFromDB(prisma, bookstore1, "bookstore")};
    if (bookstore2) {await deleteFromDB(prisma, bookstore2, "bookstore")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should respond with a status 500", async() => {
    await updateBookPrices(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  }) 

  it("should not update the price for all inventories in the database", async() => {
    notUpdatedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(notUpdatedInventory1.price).toBe(499.99)
    notUpdatedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(notUpdatedInventory2.price).toBe(499.99)
  })
})

///DELETING
describe("deleting a book with valid parameters", async() => {
  let mockReq, mockRes, newAuthor, newBook, bookstore1, bookstore2, inventory1, inventory2;
  let newImpression, newPayment, newSale, newKindleSale, newCost;
  let deletedBook, deletedInventory1, deletedInventory2, deletedSale, deletedKindleSale, deletedCost;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author");
    newBook = await createBook(prisma, "new book", [{"id": newAuthor.id}]);
    bookstore1 = await createBookstore(prisma, "bookstore1");
    bookstore2 = await createBookstore(prisma, "bookstore2");
    inventory1 = await createInventory(prisma, newBook.id, bookstore1.id, 1000, 1000);
    inventory2 = await createInventory(prisma, newBook.id, bookstore2.id, 1000, 1000);
    newImpression = await createImpression(prisma, newBook.id, 2000);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    newSale = await createSale(prisma, inventory1.id, [{"id": newPayment.id}], 100);
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}], 50, 50, dateCut, new Date(), 100);
    newCost = await createCost(prisma, newPayment.id, newBook.id, 100);

    mockReq = {
      params: {
        "id": newBook.id
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  afterAll(async() => {
    if (newCost) {await deleteFromDB(prisma, newCost, 'cost')};
    if (newKindleSale) {await deleteFromDB(prisma, newKindleSale, 'kindleSale')};
    if (newSale) {await deleteFromDB(prisma, newSale, 'sale')};
    if (newPayment) {await deleteFromDB(prisma, newPayment, 'payment')};
    if (newImpression) {await deleteFromDB(prisma, newImpression, 'impression')};
    if (inventory1) {await deleteFromDB(prisma, inventory1, "inventory")};
    if (inventory2) {await deleteFromDB(prisma, inventory2, "inventory")};
    if (bookstore1) {await deleteFromDB(prisma, bookstore1, "bookstore")};
    if (bookstore2) {await deleteFromDB(prisma, bookstore2, "bookstore")};
    if (newBook) {await deleteFromDB(prisma, newBook, "book")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
  })

  it("should return a status 200", async() => {
    await deleteBook(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the book as deleted in the database", async() => {
    deletedBook = await prisma.book.findUnique({where: {id: newBook.id}});
    expect(deletedBook.isDeleted).toBe(true)
  })

  it("should mark all tied inventories as deleted on cascade", async() => {
    deletedInventory1 = await prisma.inventory.findUnique({where: {id: inventory1.id}});
    expect(deletedInventory1.isDeleted).toBe(true);
    deletedInventory2 = await prisma.inventory.findUnique({where: {id: inventory2.id}});
    expect(deletedInventory2.isDeleted).toBe(true);
  })

  it("should mark all tied sales as deleted", async() => {
    deletedSale = await prisma.sale.findUnique({where: {id: newSale.id}});
    expect(deletedSale.isDeleted).toBe(true)
  })

  it("should mark all tied kindleSales as deleted", async() => {
    deletedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(deletedKindleSale.isDeleted).toBe(true)
  })

  it("should mark all tied Costs as deleted", async() => {
    deletedCost = await prisma.cost.findUnique({where: {id: newCost.id}});
    expect(deletedCost.isDeleted).toBe(true)
  })
})