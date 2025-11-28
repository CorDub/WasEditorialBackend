import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import {
  createAuthor,
  createTestDB,
  dropTestDB,
  createCategory
} from "../../testUtils.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));
import { getAuthors} from "../../routes/adminRoutes.js";

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



// GETTING 
describe("getting all valid authors", () => {
  let mockRes, deletedAuthor, jsonResponse;

  beforeAll(async() => {
    deletedAuthor = await createAuthor(prisma, {isDeleted: true})

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it("should return a list of all valid authors", async() => {
    await getAuthors({}, mockRes, prisma);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should not contain deleted authors", async() => {
    expect(jsonResponse.includes(deletedAuthor)).toBeFalsy()
  })
})