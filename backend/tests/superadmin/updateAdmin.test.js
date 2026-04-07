import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { PrismaClient } from '@prisma/client';
import { 
  createCategory,
  createAuthor, 
  createTestDB, 
  dropTestDB 
} from "../../testUtils.js";
import { updateAdmin } from "../../routes/superadmin/updateAdmin.js";

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


///UPDATING
describe("updating an admin with valid parameters", () => {
  let newAdmin, mockReq, mockRes;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin",
        // phonePrefix: "+52",
        // phone: "5561356226",
        // birthday: "22121988"
      }
    })

    mockReq = {
      params: {
        "id": newAdmin.id
      },
      body: {
        "firstName": "Updated",
        "lastName": 'Admin',
        "email": "updated.admin@gmail.com",
        "role": "admin",
        // "phonePrefix": "+44",
        // "phone": "5784956212",
        // "birthday": "13121988"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let updatedAdmin;
  
  it("should return status 200", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200) 
  })

  it("should update the admin in the database correctly", async() => {
    updatedAdmin = await prisma.user.findUnique({
      where: {
        id: newAdmin.id
      }
    });
    expect(updatedAdmin.first_name).toBe("Updated");
    expect(updatedAdmin.last_name).toBe("Admin");
    expect(updatedAdmin.email).toBe("updated.admin@gmail.com");
    expect(updatedAdmin.role).toBe("admin");
    // expect(updatedAdmin.phonePrefix).toBe("+44");
    // expect(updatedAdmin.phone).toBe("5784956212");
    // expect(updatedAdmin.birthday).toBe("13121988");
  })
})



describe("updating an admin with invalid parameters", () => {
  let mockReq, mockRes, newAdmin, mute;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin",
        phonePrefix: "+52",
        phone: "5561356226",
        birthday: "22121988"
      }
    })

    mockReq = {
      params: {
        "id": newAdmin.id
      },
      body: {
        "firstName": 200,
        "lastName": [],
        "email": "thiissupposedtobeanemail",
        "role": "admin"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  let updatedAdmin;

  afterAll(async () => {
    mute.mockRestore();
  });

  it("should return status 500", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the admin", async() => {
    updatedAdmin = await prisma.user.findUnique({
      where: {
        id: newAdmin.id
      }
    })
    expect(updatedAdmin.first_name).toBe("New");
    expect(updatedAdmin.last_name).toBe("Admin");
    expect(updatedAdmin.email).toBe("new.admin@gmail.com");
    expect(updatedAdmin.role).toBe("admin");
    expect(updatedAdmin.phonePrefix).toBe("+52");
    expect(updatedAdmin.phone).toBe("5561356226");
    expect(updatedAdmin.birthday).toBe("22121988");
  })
})



describe("updating a deleted admin", () => {
  let deletedAdmin, mockReq, mockRes, notUpdatedAdmin, mute;

  beforeAll(async() => {
    deletedAdmin = await createAuthor(prisma, {role:"admin", isDeleted: true})

    mockReq = {
      params: {
        "id": deletedAdmin.id
      },
      body: {
        "firstName": "Updated",
        "lastName": 'Admin',
        "email": "updated.admin@gmail.com",
        "role": "admin"
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
    mute.mockRestore()
  })

  it("should return status 500 and message", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "User has been deleted"})
      })
    )
  })

  it('should not update the admin', async() => {
    notUpdatedAdmin = await prisma.user.findUnique({
      where: {
        id: deletedAdmin.id
      }
    });
    expect(notUpdatedAdmin.first_name).toBe(deletedAdmin.first_name);
    expect(notUpdatedAdmin.last_name).toBe(deletedAdmin.last_name)
    expect(notUpdatedAdmin.email).toBe(deletedAdmin.email)
    expect(notUpdatedAdmin.role).toBe("admin")
    expect(notUpdatedAdmin.isDeleted).toBe(true)
  })
})