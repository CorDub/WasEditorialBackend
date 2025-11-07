import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { addTransfer } from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import {
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createTransfer,
  deleteFromDB 
} from "../testUtils.js";


//ADDING
describe(`adding a transfer type delivery to author`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransferToAuthor;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: null,
        quantity: 100,
        inventoryFromId: wasInventory.id,
        type: "send",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransferToAuthor, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 200", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should create a new transfer with the correct data", async() => {
    newTransferToAuthor = mockRes.json.mock.calls[0][0]
    expect(newTransferToAuthor).toBeTruthy();
    expect(newTransferToAuthor.quantity).toBe(100);
    expect(newTransferToAuthor.fromInventoryId).toBe(wasInventory.id);
    expect(newTransferToAuthor.type).toBe("send");
    expect(newTransferToAuthor.note).toBe("lo que te entregamos el otro día");
    expect(newTransferToAuthor.deliveryDate).toStrictEqual(new Date("2025-11-04"));
    expect(newTransferToAuthor.place).toBe("Salon del libro Guadalajara");
    expect(newTransferToAuthor.person).toBe("Rebeca");
  })

  it("should update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(updatedInventory.current).toBe(400);
    expect(updatedInventory.initial).toBe(1000);
    expect(updatedInventory.givenToAuthor).toBe(100);
  })
})


describe(`adding a transfer type delivery to author on a deleted inventory`, async() => {
    let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransferToAuthor;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, true, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: null,
        quantity: 100,
        inventoryFromId: wasInventory.id,
        type: "send",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransferToAuthor, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 500", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new transfer with the correct data", async() => {
    const jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while creating the transfer"});
    const inventory = await prisma.inventory.findUnique({
      where: {id: wasInventory.id},
      include: {transfersFrom: true}
    });
    expect(inventory.transfersFrom.length).toBe(0)
  })

  it("should not update the departed inventory", async() => {
    const notUpdatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(notUpdatedInventory.current).toBe(500);
    expect(notUpdatedInventory.initial).toBe(1000);
    expect(notUpdatedInventory.givenToAuthor).toBe(0);
  })
})


describe(`adding a transfer type delivery to author with invalid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransferToAuthor;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, true, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: null,
        quantity: "mil",
        inventoryFromId: "yeah nah",
        type: "ni",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransferToAuthor, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 500", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new transfer with the correct data", async() => {
    const jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while creating the transfer"});
    const inventory = await prisma.inventory.findUnique({
      where: {id: wasInventory.id},
      include: {transfersFrom: true}
    });
    expect(inventory.transfersFrom.length).toBe(0)
  })

  it("should not update the departed inventory", async() => {
    const notUpdatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(notUpdatedInventory.current).toBe(500);
    expect(notUpdatedInventory.initial).toBe(1000);
    expect(notUpdatedInventory.givenToAuthor).toBe(0);
  })
})


describe(`adding a transfer type send with valid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: newBookstore.id,
        quantity: 100,
        inventoryFromId: wasInventory.id,
        type: "send",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 200", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should create a new transfer with the correct data", async() => {
    newTransfer = mockRes.json.mock.calls[0][0]
    expect(newTransfer).toBeTruthy();
    expect(newTransfer.toInventoryId).toBe(newInventory.id);
    expect(newTransfer.quantity).toBe(100);
    expect(newTransfer.fromInventoryId).toBe(wasInventory.id);
    expect(newTransfer.type).toBe("send");
  })

  it("should update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(updatedInventory.current).toBe(400);
    expect(updatedInventory.initial).toBe(1000);
  })

  it("should update the arrival inventory", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: wasInventory.bookId,
        bookstoreId: newBookstore.id
      }
    }});
    expect(arrivalInventory.current).toBe(600);
    expect(arrivalInventory.initial).toBe(500);
  })
})


describe(`adding a valid transfer type send to a deleted inventory`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, true, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: newBookstore.id,
        quantity: 100,
        inventoryFromId: wasInventory.id,
        type: "send",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 200", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should create a new transfer with the correct data", async() => {
    newTransfer = mockRes.json.mock.calls[0][0]
    expect(newTransfer).toBeTruthy();
    expect(newTransfer.toInventoryId).toBe(newInventory.id);
    expect(newTransfer.quantity).toBe(100);
    expect(newTransfer.fromInventoryId).toBe(wasInventory.id);
    expect(newTransfer.type).toBe("send");
  })

  it("should update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(updatedInventory.current).toBe(400);
    expect(updatedInventory.initial).toBe(1000);
  })

  it("should create the arrival inventory with the correct data", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: wasInventory.bookId,
        bookstoreId: newBookstore.id
      }
    }});
    expect(arrivalInventory.current).toBe(100);
    expect(arrivalInventory.initial).toBe(100);
  })
})


describe(`adding a valid transfer type send to an inventory that doesn't exist`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;
  let createdInventory;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: 2,
        quantity: 100,
        inventoryFromId: wasInventory.id,
        type: "send",
        note: "lo que te entregamos el otro día",
        deliveryDate: new Date("2025-11-04"),
        place: "Salon del libro Guadalajara",
        person: "Rebeca"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, createdInventory, "inventory");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 200", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should create a new transfer with the correct data", async() => {
    newTransfer = mockRes.json.mock.calls[0][0]
    expect(newTransfer).toBeTruthy();
    expect(newTransfer.quantity).toBe(100);
    expect(newTransfer.fromInventoryId).toBe(wasInventory.id);
    expect(newTransfer.type).toBe("send");
    createdInventory = await prisma.inventory.findUnique({where: {id: newTransfer.toInventoryId}})
    expect(createdInventory.bookstoreId).toBe(2);
  })

  it("should update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: wasInventory.id}})
    expect(updatedInventory.current).toBe(400);
    expect(updatedInventory.initial).toBe(1000);
  })

  it("should create the arrival inventory with the correct data", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: wasInventory.bookId,
        bookstoreId: 2
      }
    }});
    expect(arrivalInventory.current).toBe(100);
    expect(arrivalInventory.initial).toBe(100);
  })
})



describe(`adding a transfer type return with valid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: wasInventory.bookstoreId,
        quantity: 100,
        inventoryFromId: newInventory.id,
        type: "return",
        // note: "lo que te entregamos el otro día",
        // deliveryDate: new Date("2025-11-04"),
        // place: "Salon del libro Guadalajara",
        // person: "Rebeca"
      }
    }
    
    console.log("mockReq.body.bookstoreToId", mockReq.body.bookstoreToId)
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 200", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should create a new transfer with the correct data", async() => {
    newTransfer = mockRes.json.mock.calls[0][0]
    expect(newTransfer).toBeTruthy();
    expect(newTransfer.toInventoryId).toBe(wasInventory.id);
    expect(newTransfer.quantity).toBe(100);
    expect(newTransfer.fromInventoryId).toBe(newInventory.id);
    expect(newTransfer.type).toBe("return");
  })

  it("should update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}})
    expect(updatedInventory.current).toBe(400);
    expect(updatedInventory.initial).toBe(500);
  })

  it("should update the arrival inventory", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: newInventory.bookId,
        bookstoreId: wasInventory.bookstoreId
      }
    }});
    expect(arrivalInventory.current).toBe(600);
    expect(arrivalInventory.initial).toBe(1000);
  })
})


describe(`adding a valid transfer type return to a deleted inventory`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, true, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    console.log("wasInventory bookstoreId", wasInventory.bookstoreId);
    mockReq = {
      body: {
        bookstoreToId: wasInventory.bookstoreId,
        quantity: 100,
        inventoryFromId: newInventory.id,
        type: "return",
        // note: "lo que te entregamos el otro día",
        // deliveryDate: new Date("2025-11-04"),
        // place: "Salon del libro Guadalajara",
        // person: "Rebeca"
      }
    }
    
    console.log("mockReq.body.bookstoreToId", mockReq.body.bookstoreToId)
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 500", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new transfer with the correct data", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while creating the transfer"});
    const inventory = await prisma.inventory.findUnique({
      where: {id: newInventory.id},
      include: {transfersFrom: true}
    });
    expect(inventory.transfersFrom.length).toBe(0)
  })

  it("should not update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}})
    expect(updatedInventory.current).toBe(500);
    expect(updatedInventory.initial).toBe(500);
  })

  it("should not create a new arrival inventory", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: newInventory.bookId,
        bookstoreId: wasInventory.bookstoreId
      }
    }});
    expect(arrivalInventory.isDeleted).toBe(true);
  })
})


describe(`adding a valid transfer type return to an inventory that doesn't exist`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newBook, newBookstore, wasInventory, newInventory, newTransfer;
  let createdInventory;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "f", "c", "f.c@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{'id': newAuthor.id}]);
    newBookstore = await createBookstore(prisma, "newBookstore");
    wasInventory = await createInventory(prisma, newBook.id, 1, 1000, 500, false, 0, 0);
    newInventory = await createInventory(prisma, newBook.id, newBookstore.id, 500, 500, false, 0, 0);

    mockReq = {
      body: {
        bookstoreToId: 105,
        quantity: 100,
        inventoryFromId: newInventory.id,
        type: "return",
        // note: "lo que te entregamos el otro día",
        // deliveryDate: new Date("2025-11-04"),
        // place: "Salon del libro Guadalajara",
        // person: "Rebeca"
      }
    }
    
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newTransfer, "transfer");
    await deleteFromDB(prisma, createdInventory, "inventory");
    await deleteFromDB(prisma, newInventory, "inventory");
    await deleteFromDB(prisma, wasInventory, "inventory");
    await deleteFromDB(prisma, newBookstore, "bookstore");
    await deleteFromDB(prisma, newBook, "book");
    await deleteFromDB(prisma, newAuthor, "author");
  })

  it("should return a status 500", async() => {
    await addTransfer(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new transfer with the correct data", async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toStrictEqual({error: "a server error occurred while creating the transfer"});
    const inventory = await prisma.inventory.findUnique({
      where: {id: newInventory.id},
      include: {transfersFrom: true}
    });
    expect(inventory.transfersFrom.length).toBe(0)
  })

  it("should not update the departed inventory", async() => {
    const updatedInventory = await prisma.inventory.findUnique({where: {id: newInventory.id}})
    expect(updatedInventory.current).toBe(500);
    expect(updatedInventory.initial).toBe(500);
  })

  it("should not create an arrival inventory", async() => {
    const arrivalInventory = await prisma.inventory.findUnique({where: {
      bookId_bookstoreId: {
        bookId: newInventory.bookId,
        bookstoreId: 105
      }
    }});
    expect(arrivalInventory).toBeFalsy();
  })
})