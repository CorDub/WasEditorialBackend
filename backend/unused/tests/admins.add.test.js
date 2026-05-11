import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { PrismaClient } from '@prisma/client';
import * as mailer from "../../mailer.js";
import { 
  createCategory,
  createAuthor, 
  createTestDB, 
  dropTestDB 
} from "../../testUtils.js";
import { addAdmin } from "../../routes/superAdminRoutes.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));

let prisma;
let testDBName;
let category1;
let admin1, newAdmin;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  admin1 = await createAuthor(prisma, {first_name: "Iama", last_name: "Newadmin", email: "iama.newadmin@gmail.com", role: "admin"});
  newAdmin = await createAuthor(prisma);
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


describe("adding a valid admin", () => {
  let mockReq, mockRes, createdAdmin;

  beforeAll(async() => {
    mockReq = {
      body: {
        "firstName": "Iama",
        "lastName": "Newadmin2",
        "email": "iama.newadmin2@gmail.com",
        "role": "admin"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return status 201 and
    return an object with firstName, lastName and email,`, async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Iama",
      "lastName": "Newadmin2",
      "email": 'iama.newadmin2@gmail.com',
    })
  })

  it("should create the user in the database with the correct data", async() => {
    createdAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Iama",
          last_name: "Newadmin2"
        }
      }
    });
    expect(createdAdmin).toBeTruthy();
    expect(createdAdmin.first_name).toBe("Iama");
    expect(createdAdmin.last_name).toBe("Newadmin2");
    expect(createdAdmin.email).toBe("iama.newadmin2@gmail.com");
    expect(createdAdmin.role).toBe("admin");
  })

  it("should send a set password email", async() => {
    expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
    expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("iama.newadmin2@gmail.com");
    expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Iama");
  })

  afterAll(async() => {
    vi.clearAllMocks();
  })
}) 



describe("adding an invalid admin", () => {
  let mockReq, mockRes, notAddedAdmin;
  mockReq = {
    body: {
      "firstName": "Neotu",
      "email": "neotu.newadmingmail.com",
      "role": "admin"
    },
    prisma: prisma
  }

  mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  const mute = vi.spyOn(console, "error").mockImplementation(() => {});

  it("should return status 500", async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create an admin", async() => {
    notAddedAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Neotu",
          last_name: "Newadmin"
        }
      }
    })
    expect(notAddedAdmin).toBeFalsy();
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    vi.clearAllMocks();
    mute.mockRestore();
  })
})



describe("adding a duplicate admin (already a user)", () => {
  let mockReq, mockRes, mute;

  beforeAll(async() => {
    mute = vi.spyOn(console, "error").mockImplementation(() => {});
    mockReq = {
      body: {
        "firstName": "Iama",
        "lastName": "Newadmin",
        "email": "iama.newadmin@gmail.com",
        "role": "admin"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    mute.mockRestore();
  })

  let notAddedAdmin;

  it("should return status 409 and return an object with firstName, lastName and email", async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(409);
  })

  it("should not create an admin", async() => {
    notAddedAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Iama",
          last_name: "Newadmin"
        }
      }
    })
    expect(notAddedAdmin.id).toBe(admin1.id);
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    vi.clearAllMocks();
  })
}) 