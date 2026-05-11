import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { changePassword } from "../../../routes/author/password/changePassword.js";
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
} from "../../../testUtils.js";
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

describe(`change password with valid credentials`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!"
      },
      session: {
        user_id: newUser.id
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })


  it(`should return a 200 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo7!", updatedUser.password)).toBe(true)
  })
})



describe(`change password with password missing capitals`, () => {
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newpasswordletsgo7!"
      },
      session: {
        user_id: newUser.id
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
    mute.mockRestore()
  })

  it(`should return a 400 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newpasswordletsgo7!", updatedUser.password)).toBe(false)
  })
})



describe(`change password with password missing numbers`, () => {
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo!"
      },
      session: {
        user_id: newUser.id
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
    mute.mockRestore()
  })

  it(`should return a 400 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo!", updatedUser.password)).toBe(false)
  })
})


describe(`change password with password missing special characters`, () => {
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7"
      },
      session: {
        user_id: newUser.id
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
    mute.mockRestore()
  })

  it(`should return a 400 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo7", updatedUser.password)).toBe(false)
  })
})



describe(`change password with insufficient length`, () => {
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586,
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "nPLG7!"
      },
      session: {
        user_id: newUser.id
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
    mute.mockRestore()
  })

  it(`should return a 400 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("nPLG7!", updatedUser.password)).toBe(false)
  })
})