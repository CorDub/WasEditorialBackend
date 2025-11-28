import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import * as mailer from "../../mailer.js";
import { getForMonth } from "../../utils.js";
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
} from "../../testUtils.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));
import { updateAuthor } from "../../routes/adminRoutes.js";
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



//UPDATING
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
    await updateAuthor(mockReq, mockRes, prisma);
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
})



describe("updating an author with invalid parameters", () => {
  let mockReq, mockRes, newAuthor, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma);

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

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  let updatedAuthor;

  afterAll(async () => {
    mute.mockRestore()
  });

  it("should return status 500", async() => {
    await updateAuthor(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the author", async() => {
    updatedAuthor = await prisma.user.findUnique({
      where: {
        id: newAuthor.id
      }
    })
    expect(updatedAuthor.first_name).toBe(newAuthor.first_name);
    expect(updatedAuthor.last_name).toBe(newAuthor.last_name);
    expect(updatedAuthor.email).toBe(newAuthor.email);
    expect(updatedAuthor.role).toBe("author");
  })
})




describe("updating a deleted author", () => {
  let deletedAuthor, mockReq, mockRes, notUpdatedAuthor, mute;

  beforeAll(async() => {
    deletedAuthor = await createAuthor(prisma, {isDeleted: true})

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

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => {
    mute.mockRestore();
  })

  it("should return status 500", async() => {
    await updateAuthor(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it('should not update the author', async() => {
    notUpdatedAuthor = await prisma.user.findUnique({
      where: {
        id: deletedAuthor.id
      }
    });
    expect(notUpdatedAuthor.first_name).toBe(deletedAuthor.first_name);
    expect(notUpdatedAuthor.last_name).toBe(deletedAuthor.last_name)
    expect(notUpdatedAuthor.email).toBe(deletedAuthor.email)
    expect(notUpdatedAuthor.role).toBe("author")
    expect(notUpdatedAuthor.isDeleted).toBe(true)
  })
})