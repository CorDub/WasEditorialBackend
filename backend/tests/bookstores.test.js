import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { 
  getBookstores, 
  getExistingBookstoreNames,
  addBookstore,
  updateBookstore,
  deleteBookstore
} from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import {
  getForMonth,
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
} from "../utils.js"
import { json } from "stream/consumers";

// GETTING
describe("getting all valid bookstores", async() => {
  let mockRes, deletedBookstore, jsonResponse;
  
  beforeAll(async() => {
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")}
  })

  it("should return a list of all valid bookstores", async() => {
    await getBookstores({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted bookstores", async() => {
    expect(jsonResponse.includes(deletedBookstore)).toBeFalsy()
  })
})


describe("getting all existing bookstore names", () => {
  let mockRes, deletedBookstore, jsonResponse;
  
  beforeAll(async() => {
    deletedBookstore = await createBookstore(prisma, "deletedBookstore", true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (deletedBookstore) {await deleteFromDB(prisma, deletedBookstore, "bookstore")}
  })

  it("should return a list of all valid bookstore names", async() => {
    await getExistingBookstoreNames({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should only send out id, title and bookId", async() => {
    expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "name", "inventories"]);
  })

  it("should not contain deleted bookstores", async() => {
    expect(jsonResponse.includes(deletedBookstore)).toBeFalsy()
  })
})


describe("adding a valid bookstore", () => {
  let addedBookstore;
  
  const mockReq = {
    body: {
      "name": "New Bookstore",
      "dealPercentage": "50",
      "comissions": "true",
      "contactName": "Bookstore Owner",
      "contactPhone": "5544809021",
      "contactEmail": "bookstore.owner@gmail.com",
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with name", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": "New Bookstore",
    })
  })

  it("should create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: "New Bookstore"}})
    console.log("addedBookstore", addedBookstore);
    expect(addedBookstore).toBeTruthy();
  })

  it("should have correct data", async() => {
    expect(addedBookstore.name).toBe("New Bookstore");
    expect(addedBookstore.deal_percentage).toBe(50);
    expect(addedBookstore.comissions).toBe(true);
    expect(addedBookstore.contact_name).toBe("Bookstore Owner");
    expect(addedBookstore.contact_phone).toBe("5544809021");
    expect(addedBookstore.contact_email).toBe("bookstore.owner@gmail.com");
  })

  afterAll(async() => {
    if (addedBookstore) {await deleteFromDB(prisma, addedBookstore, "bookstore")};
  })
})


describe("adding an invalid bookstore", () => {
  let addedBookstore;
  
  const mockReq = {
    body: {
      "name": "",
      "dealPercentage": "cinquanta",
      "comissions": "not true",
      "contactName": 15240,
      "contactPhone": "5544809021215485",
      "contactEmail": "bookstore.owner@gmailcom",
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 500", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: ""}})
    expect(addedBookstore).toBeFalsy();
  })

  afterAll(async() => {
    if (addedBookstore) {await deleteFromDB(prisma, addedBookstore, "bookstore")};
  })
})

describe("adding a duplicate bookstore", async() => {
  let addedBookstore, previousBookstore, mockReq, mockRes;

  beforeAll(async() => {
    previousBookstore = await createBookstore(prisma, "Ye Olde Bookstore");

    mockReq = {
      body: {
        "name": "Ye Olde Bookstore",
        "dealPercentage": "50",
        "comissions": "true",
        "contactName": "Bookstore Owner",
        "contactPhone": "5544809021",
        "contactEmail": "bookstore.owner@gmail.com",
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  })

  it("should return status 500", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new bookstore in the database", async() => {
    addedBookstore = await prisma.bookstore.findUnique({where: {name: "Ye Olde Bookstore"}})
    expect(addedBookstore.id).toBe(previousBookstore.id);
  })

  afterAll(async() => {
    if (previousBookstore) {await deleteFromDB(prisma, previousBookstore, "bookstore")};
    // if (addedBookstore) {await deleteFromDB(prisma, addedBookstore, "bookstore")};
  })
})

/// UPDATING
describe("updating a bookstore with valid parameters", () => {
  let newBookstore, mockReq, mockRes;
  let updatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma, "New Bookstore");

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "Updated Bookstore",
        "dealPercentage": "50",
        "comissions": "false",
        "contactName": "Bookstore Owner Updated",
        "contactPhone": "5544809021",
        "contactEmail": "bookstore.owner@gmail.com",
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  afterAll(async() => {
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")}
  });

  it("should return status 200", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should update the bookstore with the correct data in the database", async() => {
    updatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    console.log("updatedBookstore", updatedBookstore);
    expect(updatedBookstore).toBeTruthy();
    expect(updatedBookstore.name).toBe("Updated Bookstore");
    expect(updatedBookstore.deal_percentage).toBe(50);
    expect(updatedBookstore.comissions).toBe(false);
    expect(updatedBookstore.contact_name).toBe("Bookstore Owner Updated");
    expect(updatedBookstore.contact_phone).toBe("5544809021");
    expect(updatedBookstore.contact_email).toBe("bookstore.owner@gmail.com");
  })
})


describe("updating a bookstore with invalid parameters", async() => {
  let newBookstore, mockReq, mockRes;
  let notUpdatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma, "New Bookstore");

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "",
        "dealPercentage": "cinquanta",
        "comissions": "not true",
        "contactName": 15240,
        "contactPhone": "5544809021215485",
        "contactEmail": "bookstore.owner@gmailcom",
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  afterAll(async() => {
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")}
  });

  it("should return status 500", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the bookstore in the database", async() => {
    notUpdatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    expect(notUpdatedBookstore).toBeTruthy();
    expect(notUpdatedBookstore.name).toBe("New Bookstore");
  })
})

describe("updating a deleted bookstore", async() => {
  let newBookstore, mockReq, mockRes;
  let notUpdatedBookstore;

  beforeAll(async() => {
    newBookstore = await createBookstore(prisma, "New Bookstore", true);

    mockReq = {
      params: {
        "id": newBookstore.id
      },
      body: {
        "name": "Updated Bookstore",
        "dealPercentage": "50",
        "comissions": "false",
        "contactName": "Bookstore Owner Updated",
        "contactPhone": "5544809021",
        "contactEmail": "bookstore.owner@gmail.com",
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  afterAll(async() => {
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")}
  });

  it("should return status 500", async() => {
    await updateBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the bookstore in the database", async() => {
    notUpdatedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}})
    expect(notUpdatedBookstore).toBeTruthy();
    expect(notUpdatedBookstore.name).toBe("New Bookstore");
  })
})

////  DELETING
describe("deleting a bookstore with valid parameters", async() => {
  let newAuthor, newBook, newBook2, newBookstore;
  let newInventory, newInventory2, newPayment, newSale, newSale2;
  let deletedBookstore, deletedInventories, deletedSales;
  let mockReq, mockRes;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, 'Y', 'B', 'y.b@gmail.com', 'author');
    newBook = await createBook(prisma, "new book", [{"id": newAuthor.id}]);
    newBook2 = await createBook(prisma, "new book2", [{"id": newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "New Bookstore");
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 1000, 1000);
    newInventory2 = await createInventory(prisma, newBook2.id, newBookstore.id, 1000, 1000);
    newPayment = await createPayment(prisma, newAuthor.id, getForMonth(new Date()));
    newSale = await createSale(prisma, newInventory.id, [{"id": newPayment.id}]);
    newSale2 = await createSale(prisma, newInventory2.id, [{"id": newPayment.id}])

    mockReq = {
      params: {
        "id": newBookstore.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    if (newSale) {await deleteFromDB(prisma, newSale, "sale")}
    if (newSale2) {await deleteFromDB(prisma, newSale2, "sale")}
    if (newPayment) {await deleteFromDB(prisma, newPayment, "payment")}
    if (newInventory) {await deleteFromDB(prisma, newInventory, "inventory")}
    if (newInventory2) {await deleteFromDB(prisma, newInventory2, "inventory")}
    if (newBookstore) {await deleteFromDB(prisma, newBookstore, "bookstore")}
    if (newBook) {await deleteFromDB(prisma, newBook, "book")}
    if (newBook2) {await deleteFromDB(prisma, newBook2, "book")}
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")}
  });

  it("should return a status 200", async() => {
    await deleteBookstore(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the bookstore as deleted", async() => {
    deletedBookstore = await prisma.bookstore.findUnique({where: {id: newBookstore.id}});
    expect(deletedBookstore.isDeleted).toBe(true)
  });

  it("should mark all tied inventories as deleted", async() => {
    deletedInventories = await prisma.inventory.findMany({where: {bookstoreId: newBookstore.id}});
    for (const inventory of deletedInventories) {
      expect(inventory.isDeleted).toBe(true);
    }
  })

  it("should mark all sales tied to these inventories as deleted", async() => {
    deletedSales = await prisma.sale.findMany({where: {inventoryId: {in: [newInventory.id, newInventory2.id]}}})
    for (const sale of deletedSales) {
      expect(sale.isDeleted).toBe(true);
    }
  })
})