import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getUserExtra,
  updateUser
} from "../../routes/userRoutes.js";
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
import * as mailer from "../../mailer.js"

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



describe(`get user extra info`, async() => {
  let mockReq, mockRes, newUser, jsonResponse;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
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
      },
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it(`should return a 200  status`, async() => {
    await getUserExtra(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should send the extra info for the logged in user`, async() => {
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(jsonResponse.email).toBe(newUser.email)
    expect(jsonResponse.phone).toBe("5544809945")
    expect(jsonResponse.birthday).toBe("22121988")
    expect(jsonResponse.font_size).toBe(1.1)
    expect(jsonResponse.clabe).toBe(null)
    expect(jsonResponse.name_bank_account).toBe("Corentin Pierre Jean-Philippe Dubois")
    expect(jsonResponse.bank).toBe("Inbursa")
    expect(jsonResponse.swift).toBe(null)
  })
})



describe(`get extra user info for deleted user`, async() => {
  let mockReq, mockRes, newUser, jsonResponse, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
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
    newUser = await createAuthor(prisma,
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
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  it(`should return a 200 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it(`should correctly update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe(newUser.first_name)
    expect(updatedUser.last_name).toBe(newUser.last_name)
    expect(updatedUser.email).toBe(newUser.email)
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
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
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

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe(newUser.first_name)
    expect(updatedUser.last_name).toBe(newUser.last_name)
    expect(updatedUser.email).toBe(newUser.email)
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
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
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
      },
      prisma: prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe(newUser.first_name)
    expect(updatedUser.last_name).toBe(newUser.last_name)
    expect(updatedUser.email).toBe(newUser.email)
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
  let mockReq, mockRes, newUser, updatedUser, mute;

  beforeAll(async() => {
    newUser = await createAuthor(prisma,
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
      },
      prisma : prisma
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    mute = vi.spyOn(console, "error").mockImplementation(() => {})
  });

  afterAll(async() => {
    mute.mockRestore()
  })

  it(`should return a 500 status`, async() => {
    await updateUser(mockReq, mockRes) 
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it(`should not update the user bank details`, async() => {
    updatedUser = await prisma.user.findUnique({where: {id: newUser.id}})
    expect(updatedUser.first_name).toBe(newUser.first_name)
    expect(updatedUser.last_name).toBe(newUser.last_name)
    expect(updatedUser.email).toBe(newUser.email)
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