import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { PrismaClient } from '@prisma/client';
import { 
  createAuthor, 
  createTestDB, 
  dropTestDB 
} from "../../testUtils.js";
import { getAdmins } from "../../routes/superadmin/getAdmins.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));

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

describe("getAdmins get all valid admins", async() => {
  let mockReq, mockRes, jsonResponse;
  let admin1, admin2, deletedAdmin

  beforeAll(async() => {
    admin1 = await createAuthor(prisma, {role: "admin"})
    admin2 = await createAuthor(prisma, {role: "superadmin"})
    deletedAdmin = await createAuthor(prisma, {role: "admin", isDeleted: true})

    mockReq = {
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return status 200, and a list of length 2`, async() => {
    await getAdmins(mockReq, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it(`should return a list of length 2`, async() => {
    expect(Array.isArray(jsonResponse)).toBeTruthy();
    expect(jsonResponse.length).toBe(2)
  })

  it(`should return objects with 5 keys: id, first_name, last_name, email, role`, async() => {
    const res = jsonResponse[0]
    expect(Object.keys(res)).toHaveLength(5)
    expect(res).toHaveProperty("id");
    expect(res).toHaveProperty('first_name');
    expect(res).toHaveProperty('last_name');
    expect(res).toHaveProperty('email');
    expect(res).toHaveProperty('role');
  })
})