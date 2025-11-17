import { describe, expect, test, vi, it, beforeAll, afterAll } from "vitest";
import { 
  login,
  getReset,
  getUserExtra,
  updateUser,
  getConfirmationCode,
  logout
} from "../../routes/userRoutes.js";
import { changePassword } from "../../routes/authorRoutes.js";
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


describe(`get user extra info`, async() => {
  let mockReq, mockRes, newUser, jsonResponse;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
      }
    );

    mockReq = {
      session: {
        user_id: newUser.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
  })

  it(`should return a 200  status`, async() => {
    await getUserExtra(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the extra info for the logged in user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.email).toBe("new.author@gmail.com")
    expect(jsonResponse.phone).toBe("5544809945")
    expect(jsonResponse.birthday).toBe("22121988")
    expect(jsonResponse.font_size).toBe(1.1)
    expect(jsonResponse.clabe).toBe(null)
    expect(jsonResponse.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(jsonResponse.bank).toBe("Inbursa")
    expect(jsonResponse.swift).toBe(null)
  })
})


describe(`get eextra user info for deleted user`, async() => {
  let mockReq, mockRes, newUser, jsonResponse;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        isDeleted: true
      }
    );

    mockReq = {
      session: {
        user_id: newUser.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
  })

  it(`should return a 204 status`, async() => {
    await getUserExtra(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(204)
  })

  it(`should not send the extra info for the logged in user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse).toEqual({message: "No user found"})
  })
})


describe(`update user bank details with valid parameters`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa"
      }
    );

    mockReq = {
      body: {
        clabe: '323027058932957072',
        name_bank_account: "Corentin Dubois",
        bank: "Monzo",
        swift: 'GVENMXJG8I7'
      },
      session: {
        user_id: newUser.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a 200 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe("new")
    expect(updatedUser.last_name).toBe("author")
    expect(updatedUser.email).toBe("new.author@gmail.com")
    expect(updatedUser.role).toBe("author")
    expect(updatedUser.phone).toBe("5544809945")
    expect(updatedUser.birthday).toBe("22121988")
    expect(updatedUser.font_size).toBe(1.1)
    expect(updatedUser.clabe).toBe("323027058932957072")
    expect(updatedUser.name_bank_account).toBe("Corentin Dubois")
    expect(updatedUser.bank).toBe("Monzo")
    expect(updatedUser.swift).toBe("GVENMXJG8I7")
  })
})


describe(`update user invalid fields with valid parameters`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa"
      }
    );

    mockReq = {
      body: {
        first_name: 'Jean',
        last_name: "Gérard",
      },
      session: {
        user_id: newUser.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe("new")
    expect(updatedUser.last_name).toBe("author")
    expect(updatedUser.email).toBe("new.author@gmail.com")
    expect(updatedUser.role).toBe("author")
    expect(updatedUser.phone).toBe("5544809945")
    expect(updatedUser.birthday).toBe("22121988")
    expect(updatedUser.font_size).toBe(1.1)
    expect(updatedUser.clabe).toBe(null)
    expect(updatedUser.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(updatedUser.bank).toBe("Inbursa")
    expect(updatedUser.swift).toBe(null)
  })
})


describe(`update deleted user`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa",
        isDeleted: true
      }
    );

    mockReq = {
      body: {
        phone: '5588994732',
      },
      session: {
        user_id: newUser.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe("new")
    expect(updatedUser.last_name).toBe("author")
    expect(updatedUser.email).toBe("new.author@gmail.com")
    expect(updatedUser.role).toBe("author")
    expect(updatedUser.phone).toBe("5544809945")
    expect(updatedUser.birthday).toBe("22121988")
    expect(updatedUser.font_size).toBe(1.1)
    expect(updatedUser.clabe).toBe(null)
    expect(updatedUser.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(updatedUser.bank).toBe("Inbursa")
    expect(updatedUser.swift).toBe(null)
  })
})


describe(`update non logged in user`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa"
      }
    );

    mockReq = {
      body: {
        phone: '5588994732',
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe("new")
    expect(updatedUser.last_name).toBe("author")
    expect(updatedUser.email).toBe("new.author@gmail.com")
    expect(updatedUser.role).toBe("author")
    expect(updatedUser.phone).toBe("5544809945")
    expect(updatedUser.birthday).toBe("22121988")
    expect(updatedUser.font_size).toBe(1.1)
    expect(updatedUser.clabe).toBe(null)
    expect(updatedUser.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(updatedUser.bank).toBe("Inbursa")
    expect(updatedUser.swift).toBe(null)
  })
})


describe(`update non logged in user`, async() => {
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
      {
        phone: "5544809945",
        birthday: "22121988",
        font_size: 1.1,
        name_bank_account: "Corentin Pierre Jean-Philippe Dubois",
        bank: "Inbursa"
      }
    );

    mockReq = {
      body: {
        phone: '5588994732',
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe("new")
    expect(updatedUser.last_name).toBe("author")
    expect(updatedUser.email).toBe("new.author@gmail.com")
    expect(updatedUser.role).toBe("author")
    expect(updatedUser.phone).toBe("5544809945")
    expect(updatedUser.birthday).toBe("22121988")
    expect(updatedUser.font_size).toBe(1.1)
    expect(updatedUser.clabe).toBe(null)
    expect(updatedUser.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(updatedUser.bank).toBe("Inbursa")
    expect(updatedUser.swift).toBe(null)
  })
})


describe(`validate the confirmation code`, async() => {
  let mockReq, mockRes, newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
  })

  it(`should return a status 200`, async() => {
    await getConfirmationCode(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should log in the user`, async() => {
    expect(mockReq.session.user_id).toBe(newUser.id)
  })
})


describe(`validating a wrong validation code`, async() => {
  let mockReq, mockRes, newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
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
  let mockReq, mockRes, newUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author")
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
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
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
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
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
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
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
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
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
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
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
  let mockReq, mockRes, newUser, updatedUser;

  beforeAll(async() => {
    newUser = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author",
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
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, newUser, "author");
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