import { describe, expect, test, vi, it, beforeAll, afterAll } from "vitest";
import { getMonthlySalesByPayments } from "../../routes/authorRoutes.js";
import { 
  getKindleSales, 
  addKindleSale,
  updateKindleSale,
  deleteKindleSale 
} from "../../routes/adminRoutes.js";
import { prisma } from "../../prisma/client.js";
import {
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  deleteFromDB, 
  createCategory
} from "../../testUtils.js";

describe("getting monthly sales by payments", async() => {
  const mockReq = {
    "session": {
      "user_id": 152
    }
  };
  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it('should return an array of length 13', async() => {
    await getMonthlySalesByPayments(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalled();
    const responseData = mockRes.json.mock.calls[0][0];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBe(13);
  })
});

describe("getting all valid kindle sales", async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, newKindleSale2, newKindleSale3, deletedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2024-10-02"), new Date("2025-01-02"), 100)
    newKindleSale3 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2024-10-02"), new Date("2025-01-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100, {isDeleted: true})

    mockReq = {
      query: {
        startDate: new Date("2024-11-01"),
        endDate: new Date("2025-11-10")
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale3, "kindleSale")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a 200 status`, async() => {
    await getKindleSales(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid kindleSales compiled per months in the selected range`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.length).toBe(13)
  })

  it(`should compile sales per months`, async() => {
    let saleIds = [];
    for (const sale of jsonResponse[7].sales) {
      saleIds.push(sale.id)
    }
    expect(saleIds.includes(newKindleSale.id)).toBe(true)
    expect(saleIds.includes(deletedKindleSale.id)).toBe(false)

    let saleIds2 =[];
    for (const sale of jsonResponse[2].sales) {
      saleIds2.push(sale.id)
    }
    expect(saleIds2.includes(newKindleSale2.id)).toBe(true)
    expect(saleIds2.includes(newKindleSale3.id)).toBe(true)
  })
})


describe("getting all valid kindle sales with restricted date range", async() => {
  let mockReq, mockRes, jsonResponse;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, newKindleSale2, newKindleSale3, deletedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100)
    newKindleSale2 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2024-10-02"), new Date("2025-01-02"), 100)
    newKindleSale3 = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2024-10-02"), new Date("2025-01-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100, {isDeleted: true})

    mockReq = {
      query: {
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-11-10")
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, newKindleSale2, "kindleSale")
    await deleteFromDB(prisma, newKindleSale3, "kindleSale")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a 200 status`, async() => {
    await getKindleSales(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should return all valid kindleSales compiled per months in the selected range`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    // console.log("jsonResponse", jsonResponse)
    expect(jsonResponse.length).toBe(10)
  })

  it(`should compile sales per months`, async() => {
    let saleIds = [];
    for (const sale of jsonResponse[4].sales) {
      saleIds.push(sale.id)
    }
    expect(saleIds.includes(newKindleSale.id)).toBe(true)
    expect(saleIds.includes(deletedKindleSale.id)).toBe(false)

    let saleIdsEntirely = [];
    for (const month of jsonResponse) {
      for (const sale of month.sales) {
        saleIdsEntirely.push(sale.id)
      }
    }
    expect(saleIdsEntirely.includes(newKindleSale2.id)).toBe(false)
    expect(saleIdsEntirely.includes(newKindleSale3.id)).toBe(false)
  })
})


describe("adding valid kindle sale", async() => {
  let mockReq, mockRes, addedKindleSales;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}]);
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")

    mockReq = {
      "body": {
        "book": newBook.id,
        "quantityEbook": 10,
        "quantityPod": 10,
        "dateCut": "2025-09-04T00:00:00.000Z",
        "datePay": "2025-11-04T00:00:00.000Z",
        "regalias": 121.5
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    for (const kindleSale of addedKindleSales) {await deleteFromDB(prisma, kindleSale, "kindleSale")}
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it("should return status 200", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should create the kindle sale in the database`, async() => {
    addedKindleSales = await prisma.kindleSale.findMany({where: {bookId: newBook.id}})
    expect(addedKindleSales.length).toBe(1)
    expect(addedKindleSales[0].bookId).toBe(newBook.id)
    expect(addedKindleSales[0].quantityEbook).toBe(10)
    expect(addedKindleSales[0].quantityPod).toBe(10)
    expect(addedKindleSales[0].dateCut).toStrictEqual(new Date("2025-09-04T00:00:00.000Z"))
    expect(addedKindleSales[0].datePay).toStrictEqual(new Date("2025-11-04T00:00:00.000Z"))
    expect(addedKindleSales[0].regalias).toBe(121.5)
  })
});

describe("adding kindle sale with missing parameters", async() => {
  let mockReq, mockRes, addedKindleSales;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")

    mockReq = {
      "body": {
        "quantityEbook": 10,
        "quantityPod": 10,
        "dateCut": "2025-08-13T00:00:00.000Z",
        "datePay": "2025-10-13T00:00:00.000Z",
        "regalias": 121.5
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    for (const kindleSale of addedKindleSales) {await deleteFromDB(prisma, kindleSale, "kindleSale")}
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it("should return status 500", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it(`should not create a new kindleSale in the database`, async() => {
    addedKindleSales = await prisma.kindleSale.findMany({where: {bookId: newBook.id}})
    expect(addedKindleSales.length).toBe(0)
  })
})


describe(`updating Kindle sale with valid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, deletedKindleSale, updatedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100, {isDeleted: true})

    mockReq = {
      params: {
        id: newKindleSale.id
      },
      body: {
        quantityEbook: 100,
        quantityPod: 100,
        dateCut: "2025-08-13T00:00:00.000Z",
        datePay: "2025-10-13T00:00:00.000Z",
        regalias: 121000.5
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a 200 status`, async() => {
    await updateKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should properly update the kindle sale`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(updatedKindleSale.quantityEbook).toBe(100),
    expect(updatedKindleSale.quantityPod).toBe(100),
    expect(updatedKindleSale.regalias).toBe(121000.5)
  })
})


describe('updating a deleted Kindle sale', async() => {
  let mockReq, mockRes;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, deletedKindleSale, updatedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100, {isDeleted: true})

    mockReq = {
      params: {
        id: deletedKindleSale.id
      },
      body: {
        quantityEbook: 100,
        quantityPod: 100,
        dateCut: "2025-08-13T00:00:00.000Z",
        datePay: "2025-10-13T00:00:00.000Z",
        regalias: 121000.5
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
  })

  it(`should return a 500 status`, async() => {
    await updateKindleSale(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the kindle sale`, async() => {
    updatedKindleSale = await prisma.kindleSale.findUnique({where: {id: newKindleSale.id}});
    expect(updatedKindleSale.quantityEbook).toBe(10),
    expect(updatedKindleSale.quantityPod).toBe(10),
    expect(updatedKindleSale.regalias).toBe(100)
  })
})


describe(`deleting a kindleSale with valid parameters`, async() => {
  let mockReq, mockRes;
  let newAuthor, newAuthor2, newBook, newPayment, newPayment2;
  let newKindleSale, deletedKindleSale, updatedKindleSale;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, "a", "z", "a.z@gmail.com", "author");
    newAuthor2 = await createAuthor(prisma, "b", "j", "b.j@gmail.com", "author");
    newBook = await createBook(prisma, "newBook", [{"id": newAuthor.id}, {"id": newAuthor2.id}])
    newPayment = await createPayment(prisma, newAuthor.id, "2025-11")
    newPayment2 = await createPayment(prisma, newAuthor2.id, "2025-11")
    newKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100)
    deletedKindleSale = await createKindleSale(prisma, newBook.id, [{"id": newPayment.id}, {"id": newPayment2.id}], 10, 10, new Date("2025-04-02"), new Date("2025-06-02"), 100, {isDeleted: true})

    mockReq = {
      params: {
        id: newKindleSale.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newKindleSale, "kindleSale")
    await deleteFromDB(prisma, deletedKindleSale, "kindleSale")
    await deleteFromDB(prisma, newPayment2, "payment")
    await deleteFromDB(prisma, newPayment, "payment")
    await deleteFromDB(prisma, newBook, "book")
    await deleteFromDB(prisma, newAuthor, "author")
    await deleteFromDB(prisma, newAuthor2, "author")
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