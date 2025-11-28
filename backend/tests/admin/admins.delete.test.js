import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { PrismaClient } from '@prisma/client';
import { 
  createCategory,
  createAuthor, 
  createTestDB, 
  dropTestDB 
} from "../../testUtils.js";
import { deleteAdmin } from "../../routes/superAdminRoutes.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));

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

///DELETING
describe('deleting an admin with valid parameters', () => {
  let newAdmin, mockReq, mockRes;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin"
      }
    });

    mockReq = {
      params: {
        "id": newAdmin.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  let deletedAdmin;

  it("should return status 200 and mark the admin as deleted", async() => {
    await deleteAdmin(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should mark the admin as deleted in the database", async() => {
    deletedAdmin = await prisma.user.findUnique({
      where: {
        id: mockReq.params.id
      },
    })
    expect(deletedAdmin.isDeleted).toBe(true)
  })
})



describe('deleting an admin with invalid parameters', () => {
  let newAdmin, mockReq, mockRes, mute;

  beforeAll(async() => {
    newAdmin = await createAuthor(prisma, {role: "admin"})

    mockReq = {
      params: {
        "id": "thisisanid"
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    mute = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    mute.mockRestore();
  });

  it("should return status 500", async() => {
    await deleteAdmin(mockReq, mockRes, prisma);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not mark the admin as deleted in the database", async() => {
    expect(newAdmin.isDeleted).toBe(false);
  })
})