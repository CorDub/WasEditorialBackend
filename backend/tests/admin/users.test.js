import { describe, expect, test, vi, it, beforeAll, afterAll } from "vitest";
import { 
  login,
  getReset,
  getUserExtra,
  updateUser,
  getConfirmationCode,
  logout
} from "../../routes/userRoutes.js";
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
import bcrypt from 'bcrypt';
import * as mailerUtils from '../../mailer.js'


describe(`login correctly`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {password: await bcrypt.hash("thisisapassword", 10)}
    )

    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisapassword"
      },
      session: {}
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
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
    expect(jsonResponse.first_name).toBe("new")
    expect(jsonResponse.last_name).toBe("author")
    expect(jsonResponse.role).toBe("author")
    expect(jsonResponse.categoryId).toBe(1)
  })
})


describe(`login with wrong parameters`, async() => {
  let mockReq, mockRes, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {password: await bcrypt.hash("thisisapassword", 10)}
    )

    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisnotapassword"
      },
      session: {}
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
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
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {password: await bcrypt.hash("thisisapassword", 10), isDeleted: true}
    )

    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisapassword"
      },
      session: {}
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
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
  let mockReq, mockRes, send;

  beforeAll(async() => {
    mockReq = {
      body: {
        email: "new.author@gmail.com",
        password: "thisisapassword"
      },
      session: {}
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    }
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


describe(`getting passsword reset email with valid parameters`, async() => {
  let mockReq, mockRes, mailSpy, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author")

    mockReq = {
      body: {
        email: newUser.email
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailSpy = vi.spyOn(mailerUtils, "sendResetPasswordMail").mockResolvedValue();
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
    mailSpy.mockRestore()
  })

  it(`should return a 200 status`, async() => {
    await getReset(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the reset password email`, async() => {
    expect(mailSpy).toHaveBeenCalledExactlyOnceWith("new.author@gmail.com", "new")
  })

  it(`should pass you the userId`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.id).toBe(newUser.id)
  })
})