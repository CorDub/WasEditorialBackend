import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { changePassword } from "../../routes/user/changePassword.js";
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
  deleteFromDB,
  truncateAll
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
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000),
        // isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
        token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0"
      },
      // session: {
      //   user_id: newUser.id
      // },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a 200 status`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo7!", updatedUser.password)).toBe(true)
  })

  it(`should correctly null the password_token in db`, async() => {
    expect(updatedUser.reset_password_token).toBe(null)
  })

  it(`should correctly null the expiry time in db`, async() => {
    expect(updatedUser.reset_password_expires).toBe(null)
  })
})



describe(`change password with valid credentials but user is deleted`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000),
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
        token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    await changePassword(mockReq, mockRes)
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a status 401`, async() => {
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })
})



// describe(`change password with password missing capitals`, () => {
//   let mockReq, mockRes, newUser, updatedUser, mute;

//   beforeAll(async() => {
//     newUser = await createAuthor(prisma,
//       {
//         phone: "5544809945",
//         birthday: "22121988",
//         font_size: 1.1,
//         name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
//         bank: "Inbursa",
//         reset_password_code: 124586,
//       }
//     );

//     mockReq = {
//       body: {
//         password: "newpasswordletsgo7!"
//       },
//       session: {
//         user_id: newUser.id
//       },
//       prisma: prisma
//     }

//     mockRes = {
//       json: vi.fn(),
//       status: vi.fn().mockReturnThis()
//     }

//     mute = vi.spyOn(console, "error").mockImplementation(() => {})
//   })

//   afterAll(async() => {
//     mute.mockRestore()
//     await truncateAll(prisma)
//   })

//   it(`should return a 400 status`, async() => {
//     await changePassword(mockReq, mockRes)
//     expect(mockRes.status).toHaveBeenCalledWith(400)
//   })

//   it(`should not update the password`, async() => {
//     updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

//     expect(await bcrypt.compare("newpasswordletsgo7!", updatedUser.password)).toBe(false)
//   })
// })



// describe(`change password with password missing numbers`, () => {
//   let mockReq, mockRes, newUser, updatedUser, mute;

//   beforeAll(async() => {
//     newUser = await createAuthor(prisma,
//       {
//         phone: "5544809945",
//         birthday: "22121988",
//         font_size: 1.1,
//         name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
//         bank: "Inbursa",
//         reset_password_code: 124586,
//         isDeleted: true
//       }
//     );

//     mockReq = {
//       body: {
//         password: "newPasswordLetsGo!"
//       },
//       session: {
//         user_id: newUser.id
//       },
//       prisma: prisma
//     }

//     mockRes = {
//       json: vi.fn(),
//       status: vi.fn().mockReturnThis()
//     }

//     mute = vi.spyOn(console, "error").mockImplementation(() => {})
//   })

//   afterAll(async() => {
//     mute.mockRestore()
//   })

//   it(`should return a 400 status`, async() => {
//     await changePassword(mockReq, mockRes)
//     expect(mockRes.status).toHaveBeenCalledWith(400)
//   })

//   it(`should not update the password`, async() => {
//     updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

//     expect(await bcrypt.compare("newPasswordLetsGo!", updatedUser.password)).toBe(false)
//   })
// })


// describe(`change password with password missing special characters`, () => {
//   let mockReq, mockRes, newUser, updatedUser, mute;

//   beforeAll(async() => {
//     newUser = await createAuthor(prisma,
//       {
//         phone: "5544809945",
//         birthday: "22121988",
//         font_size: 1.1,
//         name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
//         bank: "Inbursa",
//         reset_password_code: 124586,
//         isDeleted: true
//       }
//     );

//     mockReq = {
//       body: {
//         password: "newPasswordLetsGo7"
//       },
//       session: {
//         user_id: newUser.id
//       },
//       prisma: prisma
//     }

//     mockRes = {
//       json: vi.fn(),
//       status: vi.fn().mockReturnThis()
//     }

//     mute = vi.spyOn(console, "error").mockImplementation(() => {})
//   })

//   afterAll(async() => {
//     mute.mockRestore()
//   })

//   it(`should return a 400 status`, async() => {
//     await changePassword(mockReq, mockRes)
//     expect(mockRes.status).toHaveBeenCalledWith(400)
//   })

//   it(`should not update the password`, async() => {
//     updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

//     expect(await bcrypt.compare("newPasswordLetsGo7", updatedUser.password)).toBe(false)
//   })
// })



describe(`change password with insufficient length`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000)
      }
    );

    mockReq = {
      body: {
        password: "nPLG7!",
        token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
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


describe(`token is missing`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000)
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a 400`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })
})



describe(`token is incorrect`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000)
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
        token: "a3f8c2e1b4d7e9f0a1b2c3d4e5f6a7b8"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a 401`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo7!", updatedUser.password)).toBe(false)
  })
})



describe(`token is expired`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() - 60 * 60 * 1000)
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
        token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a 401`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  it(`should not update the password`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})

    expect(await bcrypt.compare("newPasswordLetsGo7!", updatedUser.password)).toBe(false)
  })
})



describe(`new password is same as previous password`, () => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0",
        reset_password_expires: new Date(Date.now() + 60 * 60 * 1000),
        password: await bcrypt.hash("newPasswordLetsGo7!", 10)
      }
    );

    mockReq = {
      body: {
        password: "newPasswordLetsGo7!",
        token: "52401bb2b5cde0fe71b5057a503ea489055b6bec60aa385c7fd5330ddc1ab9c0"
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should return a 400`, async() => {
    await changePassword(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })
})