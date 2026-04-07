import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  login
} from "../../routes/user/login.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

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



describe(`login correctly`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, {password: await bcrypt.hash("thisisapassword", 10)})

    mockReq = {
      body: {
        email: newUser.email,
        password: "thisisapassword"
      },
      session: {},
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it(`should return a status 200`, async() => {
    await login(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly log you in`, async() => {
    const user = await prisma.user.findUnique({where: {email: newUser.email}})
    expect(mockReq.session.user_id).toBe(newUser.id)
  })

  it(`should return basic info on the user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.id).toBe(newUser.id)
    expect(jsonResponse.first_name).toBe(newUser.first_name)
    expect(jsonResponse.last_name).toBe(newUser.last_name)
    expect(jsonResponse.role).toBe("author")
  })
})

describe(`login with wrong parameters`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, {password: await bcrypt.hash("thisisapassword", 10)})

    mockReq = {
      body: {
        email: newUser.email,
        password: "thisisnotapassword"
      },
      session: {},
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    },

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 401`, async() => {
    await login(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not log you in`, async() => {
    const user = await prisma.user.findUnique({where: {email: newUser.email}})
    expect(mockReq.session.user_id).toBe(undefined)
  })

  it(`should not return basic info on the user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toEqual({error: "Wrong password or email address"})
  })
})



describe(`login with a deleted user`, async() => {
  let mockReq, mockRes, send;
  let newUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(
      prisma, 
      {
        email: "new.author@gmail.com",
        password: await bcrypt.hash("thisisapassword", 10), 
        isDeleted: true
      })

    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisapassword"
      },
      session: {},
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    // mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    // mute.mockRestore()
  })

  it(`should return a status 401`, async() => {
    await login(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not log you in`, async() => {
    const user = await prisma.user.findUnique({where: {email: newUser.email}})
    expect(mockReq.session.user_id).toBe(undefined)
  })

  it(`should not return basic info on the user`, async() => {
    send = mockRes.send.mock.calls[0][0]
    expect(send).toBe("No tenemos una cuenta registrada con este correo.")
  })
})



describe(`login with a user that doesn't exist`, async() => {
  let mockReq, mockRes, send, mute;

  beforeAll(async() => {
    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisapassword"
      },
      session: {},
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 401`, async() => {
    await login(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not log you in`, async() => {
    expect(mockReq.session.user_id).toBe(undefined)
  })

  it(`should not return basic info on the user`, async() => {
    send = mockRes.send.mock.calls[0][0]
    expect(send).toBe("No tenemos una cuenta registrada con este correo.")
  })
})
