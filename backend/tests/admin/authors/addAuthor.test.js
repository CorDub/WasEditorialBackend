import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import * as mailer from "../../../mailer.js";
import {
  createTestDB,
  dropTestDB,
  createCategory,
  createAuthor,
  truncateAll
} from "../../../testUtils.js";

vi.mock('../../../mailer.js', () => ({
  sendWelcomeMail: vi.fn(),
}));
import { addAuthor } from "../../../routes/admin/authors/addAuthor.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


// ADDING
describe("adding a valid author", () => {
  let mockReq, mockRes, createdAuthor;
  let category1;

  beforeAll(async() => {
    category1 = await createCategory(prisma)

    mockReq = {
      body: {
        "firstName": "Yesi Deeba",
        "lastName": "Amanewauthor Ureh",
        "referido": "",
        "email": "yesi.amanewauthor@gmail.com",
        "phonePrefix": "+52",
        "phone": "5561356226",
        "birthday": "22121988",
      },
      prisma: prisma
    }

    mockRes= {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    vi.clearAllMocks()
    await truncateAll(prisma)
  })

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
    expect(createdAuthor.referido).toBe("");
    expect(createdAuthor.phone).toBe("5561356226");
    expect(createdAuthor.phonePrefix).toBe("+52");
    expect(createdAuthor.birthday).toBe("22121988");;
    expect(createdAuthor.role).toBe("author");
  })

  it("should send a set password email", async() => {
    expect(mailer.sendWelcomeMail).toHaveBeenCalled();
    expect(mailer.sendWelcomeMail.mock.calls[0][0]).toBe("yesi.amanewauthor@gmail.com");
    expect(mailer.sendWelcomeMail.mock.calls[0][1]).toBe("Yesi Deeba");
  })
})



describe("adding an invalid author", () => {
  let mockReq, mockRes, notAddedAuthor, mute;
  let category;

  beforeAll(async() => {
    category = await createCategory(prisma)

    mockReq = {
      body: {
        "firstName": "Yes Deeba",
        "lastName": 'Amanewautho Ureh',
        "email": "yesi.amanewauthorgmail.com"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  })

  afterAll(async() => {
    vi.clearAllMocks();
    mute.mockRestore();
    await truncateAll(prisma);
  })

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yes Deeba",
          last_name: "Amanewautho Ureh"
        }
      }
    })
    expect(notAddedAuthor).toBeFalsy();
  })

  it("should not send a password email", async() => {
    expect(mailer.sendWelcomeMail).not.toHaveBeenCalled();
  })
})



describe("adding a duplicate author (already a user)", () => {
  let mockReq, mockRes, newAuthor, mute;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, {
      country: "México",
      referido: "",
      phonePrefix: "+52",
      phone: "5561356226",
      birthday: "22121988",
      categoryId: 1
    })

    mockReq = {
      body: {
        "firstName": newAuthor.first_name,
        "lastName": newAuthor.last_name,
        "country": "México",
        "referido": "",
        "email": newAuthor.email,
        "phonePrefix": "+52",
        "phone": "5561356226",
        "birthday": "22121988",
        "category": "1"
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
    vi.clearAllMocks();
    mute.mockRestore();
    await truncateAll(prisma)
  })

  let notAddedAuthor;

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: newAuthor.first_name,
          last_name: newAuthor.last_name
        }
      }
    })
    expect(notAddedAuthor.id).toBe(newAuthor.id);
  })

  it("should not send a password email", async() => {
    expect(mailer.sendWelcomeMail).not.toHaveBeenCalled();
  })
}) 