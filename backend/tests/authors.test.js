import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getAuthors,
  addAuthor, 
  addMultipleAuthors, 
  updateAuthor, 
  deleteAuthor } from "../routes/adminRoutes.js";
import { prisma } from "../prisma/client.js";
import * as mailer from "../mailer.js";
import { getForMonth } from "../utils.js";
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

vi.mock('../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));

// GETTING 
describe("getting all valid authors", () => {
  let mockRes, deletedAuthor, jsonResponse;

  beforeAll(async() => {
    deletedAuthor = await createAuthor(prisma, 
      "firstName", 
      "deletedAuthor", 
      "firstName.deletedAuthor@gmail.com",
      "author",
      true
    )

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (deletedAuthor) {
      await deleteFromDB(prisma, deletedAuthor, "author")
    }
  })

  it("should return a list of all valid authors", async() => {
    await getAuthors({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    console.log("jsonResponse", jsonResponse);
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted authors", async() => {
    expect(jsonResponse.includes(deletedAuthor)).toBeFalsy()
  })
})

// ADDING
describe("adding a valid author", () => {
  const mockReq = {
    body: {
      "firstName": "Yesi Deeba",
      "lastName": "Amanewauthor Ureh",
      "country": "México",
      "referido": "",
      "email": "yesi.amanewauthor@gmail.com",
      "phone": "5561356226",
      "birthday": "22121988",
      "category": "1"
    }
  }

  const mockRes= {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  let createdAuthor;

  it("should return status 201 and return json with firstName, lastName and email", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Yesi Deeba",
      "lastName": 'Amanewauthor Ureh',
      "email": "yesi.amanewauthor@gmail.com"
    })
  })

  it("should create the user in the database with the correct data", async() => {
    createdAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yesi Deeba",
          last_name: "Amanewauthor Ureh"
        }
      }
    });
    expect(createdAuthor).toBeTruthy();
    expect(createdAuthor.first_name).toBe("Yesi Deeba");
    expect(createdAuthor.last_name).toBe("Amanewauthor Ureh");
    expect(createdAuthor.email).toBe("yesi.amanewauthor@gmail.com");
    expect(createdAuthor.country).toBe("México");
    expect(createdAuthor.referido).toBe("");
    expect(createdAuthor.phone).toBe("5561356226");
    expect(createdAuthor.birthday).toBe("22121988");
    expect(createdAuthor.categoryId).toBe(1);
    expect(createdAuthor.role).toBe("author");
  })

  it("should send a set password email", async() => {
    expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
    expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("yesi.amanewauthor@gmail.com");
    expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Yesi Deeba");
  })

  afterAll(async() => {
    if (createdAuthor) {
      await prisma.user.delete({
        where: {
          id: createdAuthor.id
        }
      })
    }

    vi.clearAllMocks();
  })
})

describe("adding an invalid author", () => {
  let mockReq, mockRes, notAddedAuthor;
  mockReq = {
    body: {
      "firstName": "Yesi Deeba",
      "lastName": 'Amanewauthor Ureh',
      "email": "yesi.amanewauthor@gmail.com"
    }
  }

  mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yesi Deeba",
          last_name: "Amanewauthor Ureh"
        }
      }
    })
    expect(notAddedAuthor).toBeFalsy();
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    if (notAddedAuthor) {
      await prisma.user.delete({
        where: {
          id: notAddedAuthor.id
        }
      })
    }

    vi.clearAllMocks();
  })
})

describe("adding a duplicate author (already a user)", () => {
  let mockReq, mockRes, newAuthor;

  beforeAll(async() => {
    newAuthor = await prisma.user.create({
      data: {
        "first_name": "Yesi Deeba",
        "last_name": "Amanewauthor Ureh",
        "country": "México",
        "referido": "",
        "email": "yesi.amanewauthor@gmail.com",
        "phone": "5561356226",
        "birthday": "22121988",
        "categoryId": 1
      }
    })

    mockReq = {
      body: {
        "firstName": "Yesi Deeba",
        "lastName": "Amanewauthor Ureh",
        "country": "México",
        "referido": "",
        "email": "yesi.amanewauthor@gmail.com",
        "phone": "5561356226",
        "birthday": "22121988",
        "category": "1"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let notAddedAuthor;

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yesi Deeba",
          last_name: "Amanewauthor Ureh"
        }
      }
    })
    expect(notAddedAuthor.id).toBe(newAuthor.id);
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    if (notAddedAuthor) {
      await prisma.user.delete({
        where: {
          id: notAddedAuthor.id
        }
      })
      return;
    }

    if (newAuthor) {
      await prisma.user.delete({
        where: {
          id: newAuthor.id
        }
      })
    }

    vi.clearAllMocks();
  })
}) 

//ADDING MULTIPLES
// describe("adding multiple authors with valid parameters", () => {
//    const mockReq = {
//     body: {
//       "firstName": "Yesi Deeba",
//       "lastName": "Amanewauthor Ureh",
//       "country": "México",
//       "referido": "",
//       "email": "yesi.amanewauthor@gmail.com",
//       "phone": "5561356226",
//       "birthday": "22121988",
//       "category": "1"
//     }
//   }

//   const mockRes= {
//     json: vi.fn(),
//     status: vi.fn().mockReturnThis()
//   }

//   let createdAuthor;

//   it("should return status 201 and return json with firstName, lastName and email", async() => {
//     await addAuthor(mockReq, mockRes);
//     expect(mockRes.status).toHaveBeenCalledWith(201);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       "firstName": "Yesi Deeba",
//       "lastName": 'Amanewauthor Ureh',
//       "email": "yesi.amanewauthor@gmail.com"
//     })
//   })

//   it("should create the user in the database with the correct data", async() => {
//     createdAuthor = await prisma.user.findUnique({
//       where: {
//         first_name_last_name: {
//           first_name: "Yesi Deeba",
//           last_name: "Amanewauthor Ureh"
//         }
//       }
//     });
//     expect(createdAuthor).toBeTruthy();
//     expect(createdAuthor.first_name).toBe("Yesi Deeba");
//     expect(createdAuthor.last_name).toBe("Amanewauthor Ureh");
//     expect(createdAuthor.email).toBe("yesi.amanewauthor@gmail.com");
//     expect(createdAuthor.country).toBe("México");
//     expect(createdAuthor.referido).toBe("");
//     expect(createdAuthor.phone).toBe("5561356226");
//     expect(createdAuthor.birthday).toBe("22121988");
//     expect(createdAuthor.categoryId).toBe(1);
//     expect(createdAuthor.role).toBe("author");
//   })

//   it("should send a set password email", async() => {
//     expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
//     expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("yesi.amanewauthor@gmail.com");
//     expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Yesi Deeba");
//   })

//   afterAll(async() => {
//     if (createdAuthor) {
//       await prisma.user.delete({
//         where: {
//           id: createdAuthor.id
//         }
//       })
//     }

//     vi.clearAllMocks();
//   })
// })

///UPDATING
describe("updating an author with valid parameters", () => {
  let newAuthor, mockReq, mockRes;

  beforeAll(async() => {
    newAuthor = await prisma.user.create({
      data: {
        "first_name": "Yesi Deeba",
        "last_name": "Amanewauthor Ureh",
        "country": "México",
        "referido": "",
        "email": "yesi.amanewauthor@gmail.com",
        "phone": "5561356226",
        "birthday": "22121988",
        "categoryId": 1
      }
    })

    mockReq = {
      params: {
        "id": newAuthor.id
      },
      body: {
        "firstName": "Updated",
        "lastName": "Author",
        "country": "México",
        "referido": "",
        "email": "updated.author@gmail.com",
        "phone": "5561356226",
        "birthday": "22121988",
        "categoryId": "1"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let updatedAuthor;
  
  it("should return status 200", async() => {
    await updateAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200) 
  })

  it("should update the author in the database correctly", async() => {
    updatedAuthor = await prisma.user.findUnique({
      where: {
        id: newAuthor.id
      }
    });
    expect(updatedAuthor.first_name).toBe("Updated");
    expect(updatedAuthor.last_name).toBe("Author");
    expect(updatedAuthor.email).toBe("updated.author@gmail.com");
    expect(updatedAuthor.role).toBe("author");
  })

  afterAll(async() => {
    if (updatedAuthor) {
      await prisma.user.delete({
        where: {
          id: updatedAuthor.id
        }
      })
      return;
    }

    if (newAuthor) {
      await prisma.user.delete({
        where: {
          id: newAuthor.id
        }
      })
    }
  })
})

describe("updating an author with invalid parameters", () => {
  let mockReq, mockRes, newAuthor;

  beforeAll(async() => {
    newAuthor = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Author",
        email: "new.author@gmail.com",
        role: "author"
      }
    })

    mockReq = {
      params: {
        "id": newAuthor.id
      },
      body: {
        "firstName": 200,
        "lastName": [],
        "email": "thiissupposedtobeanemail",
        "role": "author"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  let updatedAuthor;

  afterAll(async () => {
    if (updatedAuthor) {
      await prisma.user.delete({
        where: {
          id: updatedAuthor.id
        }
      })
      return;
    }
    
    if (newAuthor) {
      await prisma.user.delete({
        where: {
          id: newAuthor.id
        }
      })
    }
  });

  it("should return status 500", async() => {
    await updateAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the author", async() => {
    updatedAuthor = await prisma.user.findUnique({
      where: {
        id: newAuthor.id
      }
    })
    expect(updatedAuthor.first_name).toBe("New");
    expect(updatedAuthor.last_name).toBe("Author");
    expect(updatedAuthor.email).toBe("new.author@gmail.com");
    expect(updatedAuthor.role).toBe("author");
  })
})

describe("updating a deleted author", () => {
  let deletedAuthor, mockReq, mockRes, notUpdatedAuthor;

  beforeAll(async() => {
    deletedAuthor = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Author",
        email: "new.author@gmail.com",
        role: "author",
        isDeleted: true
      }
    });

    mockReq = {
      params: {
        "id": deletedAuthor.id
      },
      body: {
        "firstName": "Updated",
        "lastName": 'Author',
        "email": "updated.author@gmail.com",
        "role": "author"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (notUpdatedAuthor) {
      await prisma.user.delete({
        where: {
          id: notUpdatedAuthor.id
        }
      })
      return;
    }

    if (deletedAuthor) {
      await prisma.user.delete({
        where: {
          id: deletedAuthor.id
        }
      })
    }
  })

  it("should return status 500", async() => {
    await updateAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it('should not update the author', async() => {
    notUpdatedAuthor = await prisma.user.findUnique({
      where: {
        id: deletedAuthor.id
      }
    });
    expect(notUpdatedAuthor.first_name).toBe("New");
    expect(notUpdatedAuthor.last_name).toBe("Author")
    expect(notUpdatedAuthor.email).toBe("new.author@gmail.com")
    expect(notUpdatedAuthor.role).toBe("author")
    expect(notUpdatedAuthor.isDeleted).toBe(true)
  })
})

///DELETING
describe('deleting an author with valid parameters', () => {
  let mockReq; 
  let mockRes; 
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
    newAuthor = await createAuthor(prisma, "New", "Author", "new.author@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "New2", "Author2", "new.author2@gmail.com", "author");
    bookWithOnlyAuthor = await createBook(prisma, "First book", [{"id": newAuthor.id}]);
    bookWithSeveralAuthors = await createBook(prisma, "Second book", [{"id": newAuthor.id}, {"id": newAuthor2.id}]);
    impressionBookWithOnlyAuthor = await createImpression(prisma, bookWithOnlyAuthor.id, 100);
    impressionBookWithSeveralAuthors = await createImpression(prisma, bookWithSeveralAuthors.id, 100);
    bookstore1 = await createBookstore(prisma, "First Bookstore");
    bookstore2 = await createBookstore(prisma, "Second Bookstore");
    inventoryBookWithOnlyAuthor1 = await createInventory(prisma, bookWithOnlyAuthor.id, bookstore1.id, 100, 100);
    inventoryBookWithOnlyAuthor2 = await createInventory(prisma, bookWithOnlyAuthor.id, bookstore2.id, 100, 100);
    inventoryBookWithSeveralAuthors = await createInventory(prisma, bookWithSeveralAuthors.id, bookstore1.id, 100, 100);
    paymentNewAuthor = await createPayment(prisma, newAuthor.id, getForMonth(new Date().toISOString()));
    paymentNewAuthor2 = await createPayment(prisma, newAuthor2.id, getForMonth(new Date().toISOString()));
    saleInventoryBookWithOnlyAuthor1 = await createSale(prisma, inventoryBookWithOnlyAuthor1.id, [{"id": paymentNewAuthor.id}], 10);
    saleInventoryBookWithOnlyAuthor2 = await createSale(prisma, inventoryBookWithOnlyAuthor2.id, [{"id": paymentNewAuthor.id}], 10);
    saleInventoryBookWithSeveralAuthors = await createSale(prisma, inventoryBookWithSeveralAuthors.id, [{"id": paymentNewAuthor.id}, {"id": paymentNewAuthor2.id}], 10);
    const dateCut = new Date(new Date().setMonth(new Date().getMonth() - 2));
    kindleSaleBookWithOnlyAuthor = await createKindleSale(prisma, bookWithOnlyAuthor.id, [{"id": paymentNewAuthor.id}], 10, 10, dateCut, new Date(), 100);
    kindleSaleBookWithSeveralAuthors = await createKindleSale(prisma, bookWithSeveralAuthors.id, [{"id": paymentNewAuthor.id}, {"id": paymentNewAuthor2.id}], 10, 10, new Date(), dateCut, 100);
    costBookWithOnlyAuthor1 = await createCost(prisma, paymentNewAuthor.id, bookWithOnlyAuthor.id, 10);
    costBookWithOnlyAuthor2 = await createCost(prisma, paymentNewAuthor.id, bookWithOnlyAuthor.id, 10);
    costBookWithSeveralAuthors1 = await createCost(prisma, paymentNewAuthor.id, bookWithSeveralAuthors.id, 10);
    costBookWithSeveralAuthors2 = await createCost(prisma, paymentNewAuthor2.id, bookWithSeveralAuthors.id, 10);

    mockReq = {
      params: {
        "id": newAuthor.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  let deletedAuthor;

  afterAll(async () => {
    //cleanup of all data;
    await deleteFromDB(prisma, costBookWithOnlyAuthor1, "cost");
    await deleteFromDB(prisma, costBookWithOnlyAuthor2, "cost");
    await deleteFromDB(prisma, costBookWithSeveralAuthors1, "cost");
    await deleteFromDB(prisma, costBookWithSeveralAuthors2, "cost");
    await deleteFromDB(prisma, kindleSaleBookWithOnlyAuthor, "kindleSale");
    await deleteFromDB(prisma, kindleSaleBookWithSeveralAuthors, "kindleSale");
    await deleteFromDB(prisma, saleInventoryBookWithOnlyAuthor1, "sale");
    await deleteFromDB(prisma, saleInventoryBookWithOnlyAuthor2, "sale");
    await deleteFromDB(prisma, saleInventoryBookWithSeveralAuthors, "sale");
    await deleteFromDB(prisma, paymentNewAuthor, "payment");
    await deleteFromDB(prisma, paymentNewAuthor2, "payment");
    await deleteFromDB(prisma, inventoryBookWithOnlyAuthor1, "inventory");
    await deleteFromDB(prisma, inventoryBookWithOnlyAuthor2, "inventory");
    await deleteFromDB(prisma, inventoryBookWithSeveralAuthors, "inventory");
    await deleteFromDB(prisma, bookstore1, "bookstore"); 
    await deleteFromDB(prisma, bookstore2, "bookstore"); 
    await deleteFromDB(prisma, impressionBookWithOnlyAuthor, "impression");
    await deleteFromDB(prisma, impressionBookWithSeveralAuthors, "impression");
    await deleteFromDB(prisma, bookWithOnlyAuthor, "book"); 
    await deleteFromDB(prisma, bookWithSeveralAuthors, "book");
    await deleteFromDB(prisma, newAuthor, "author");
    await deleteFromDB(prisma, newAuthor2, "author");
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
  let newAuthor, mockReq, mockRes;

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
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  let deletedAuthor;

  afterAll(async () => {
    if (deletedAuthor) {
      await prisma.user.delete({
        where: {
          id: deletedAuthor.id
        }
      })
      return;
    }
    
    if (newAuthor) {
      await prisma.user.delete({
        where: {
          id: newAuthor.id
        }
      })
    }
  });

  it("should return status 500", async() => {
    await deleteAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not mark the author as deleted in the database", async() => {
    expect(newAuthor.isDeleted).toBe(false);
  })
})