import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  login,
  getReset,
  getConfirmationCode,
  logout
} from "../../routes/userRoutes.js";
import { changePassword } from "../../routes/authorRoutes.js";
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
import * as mailer from "../../mailer.js";
import bcrypt from "bcrypt";

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



describe(`getting passsword reset email with valid parameters`, async() => {
  let mockReq, mockRes, mailSpy, jsonResponse;
  let newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma)

    mockReq = {
      body: {
        email: newUser.email
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mailSpy = vi.spyOn(mailer, "sendResetPasswordMail").mockResolvedValue();
  })

  afterAll(async() => {
    mailSpy.mockRestore()
  })

  it(`should return a 200 status`, async() => {
    await getReset(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the reset password email`, async() => {
    expect(mailSpy).toHaveBeenCalledExactlyOnceWith(newUser.email, newUser.first_name)
  })

  it(`should pass you the userId`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.id).toBe(newUser.id)
  })
})



describe(`validate the confirmation code`, async() => {
  let mockReq, mockRes, newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586
      }
    );

    mockReq = {
      body: {
        confirmation_code: 124586,
        user_id: newUser.id
      },
      session: {
        user_id: null
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it(`should return a status 200`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(newUser.id)
  })
})



describe(`validating a wrong validation code`, async() => {
  let mockReq, mockRes, newUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        reset_password_code: 124586
      }
    );

    mockReq = {
      body: {
        confirmation_code: "X12K45",
        user_id: newUser.id
      },
      session: {
        user_id: null
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(null)
  })
})


describe(`validate the confirmation code for a deleted user`, async() => {
  let mockReq, mockRes, newUser, mute;

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
        confirmation_code: 124586,
        user_id: newUser.id
      },
      session: {
        user_id: null
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a status 500`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(null)
  })
})


describe(`logout correctly`, async() => {
  let mockReq, mockRes, newUser;

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
      session: {
        user_id: newUser.id,
        destroy: vi.fn((cb) => cb(null))
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a status 200`, async() => {
    await logout(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should log out the user`, async() => {
    expect(mockReq.session.destroy).toHaveBeenCalled()
  })

  it(`should clear the session cookie`, async() => {
    expect(mockRes.clearCookie).toHaveBeenCalledExactlyOnceWith("connect.sid")
  })
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
