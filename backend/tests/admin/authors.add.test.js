import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import * as mailer from "../../mailer.js";
import {
  createTestDB,
  dropTestDB,
  createCategory,
  createAuthor
} from "../../testUtils.js";

vi.mock('../../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));
import { addAuthor, addMultipleAuthors } from "../../routes/adminRoutes.js";
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



// ADDING
describe("adding a valid author", () => {
  let mockReq, mockRes, createdAuthor;

  beforeAll(async() => {
    mockReq = {
      body: {
        "firstName": "Yesi Deeba",
        "lastName": "Amanewauthor Ureh",
        "country": "México",
        "referido": "",
        "email": "yesi.amanewauthor@gmail.com",
        "phone": "5561356226",
        "birthday": "22121988",
        "category": "1"
      },
      prisma: prisma
    }

    mockRes= {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  it("should return status 201 and return json with firstName, lastName and email", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Yesi Deeba",
      "lastName": 'Amanewauthor Ureh',
      "email": "yesi.amanewauthor@gmail.com"
    })
  })

  it("should create the user in the database with the correct data", async() => {
    createdAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yesi Deeba",
          last_name: "Amanewauthor Ureh"
        }
      }
    });
    expect(createdAuthor).toBeTruthy();
    expect(createdAuthor.first_name).toBe("Yesi Deeba");
    expect(createdAuthor.last_name).toBe("Amanewauthor Ureh");
    expect(createdAuthor.email).toBe("yesi.amanewauthor@gmail.com");
    expect(createdAuthor.country).toBe("México");
    expect(createdAuthor.referido).toBe("");
    expect(createdAuthor.phone).toBe("5561356226");
    expect(createdAuthor.birthday).toBe("22121988");
    expect(createdAuthor.categoryId).toBe(1);
    expect(createdAuthor.role).toBe("author");
  })

  it("should send a set password email", async() => {
    expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
    expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("yesi.amanewauthor@gmail.com");
    expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Yesi Deeba");
  })

  afterAll(async() => {
    vi.clearAllMocks();
  })
})



describe("adding an invalid author", () => {
  let mockReq, mockRes, notAddedAuthor, mute;
  mockReq = {
    body: {
      "firstName": "Yes Deeba",
      "lastName": 'Amanewautho Ureh',
      "email": "yesi.amanewauthorgmail.com"
    },
    prisma: prisma
  }

  mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  mute = vi.spyOn(console, "error").mockImplementation(() => {});

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Yes Deeba",
          last_name: "Amanewautho Ureh"
        }
      }
    })
    expect(notAddedAuthor).toBeFalsy();
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    vi.clearAllMocks();
    mute.mockRestore();
  })
})



describe("adding a duplicate author (already a user)", () => {
  let mockReq, mockRes, newAuthor;

  beforeAll(async() => {
    newAuthor = await createAuthor(prisma, {
      country: "México",
      referido: "",
      phone: "5561356226",
      birthday: "22121988",
      categoryId: 1
    })

    mockReq = {
      body: {
        "firstName": newAuthor.first_name,
        "lastName": newAuthor.last_name,
        "country": "México",
        "referido": "",
        "email": newAuthor.email,
        "phone": "5561356226",
        "birthday": "22121988",
        "category": "1"
      }, 
      prisma: prisma
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let notAddedAuthor;

  it("should return status 500", async() => {
    await addAuthor(mockReq, mockRes);
  })

  it("should not create an author", async() => {
    notAddedAuthor = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: newAuthor.first_name,
          last_name: newAuthor.last_name
        }
      }
    })
    expect(notAddedAuthor.id).toBe(newAuthor.id);
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    vi.clearAllMocks();
  })
}) 

//ADDING MULTIPLES
// describe("adding multiple authors with valid parameters", () => {
//    const mockReq = {
//     body: {
//       "firstName": "Yesi Deeba",
//       "lastName": "Amanewauthor Ureh",
//       "country": "México",
//       "referido": "",
//       "email": "yesi.amanewauthor@gmail.com",
//       "phone": "5561356226",
//       "birthday": "22121988",
//       "category": "1"
//     }
//   }

//   const mockRes= {
//     json: vi.fn(),
//     status: vi.fn().mockReturnThis()
//   }

//   let createdAuthor;

//   it("should return status 201 and return json with firstName, lastName and email", async() => {
//     await addAuthor(mockReq, mockRes);
//     expect(mockRes.status).toHaveBeenCalledWith(201);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       "firstName": "Yesi Deeba",
//       "lastName": 'Amanewauthor Ureh',
//       "email": "yesi.amanewauthor@gmail.com"
//     })
//   })

//   it("should create the user in the database with the correct data", async() => {
//     createdAuthor = await prisma.user.findUnique({
//       where: {
//         first_name_last_name: {
//           first_name: "Yesi Deeba",
//           last_name: "Amanewauthor Ureh"
//         }
//       }
//     });
//     expect(createdAuthor).toBeTruthy();
//     expect(createdAuthor.first_name).toBe("Yesi Deeba");
//     expect(createdAuthor.last_name).toBe("Amanewauthor Ureh");
//     expect(createdAuthor.email).toBe("yesi.amanewauthor@gmail.com");
//     expect(createdAuthor.country).toBe("México");
//     expect(createdAuthor.referido).toBe("");
//     expect(createdAuthor.phone).toBe("5561356226");
//     expect(createdAuthor.birthday).toBe("22121988");
//     expect(createdAuthor.categoryId).toBe(1);
//     expect(createdAuthor.role).toBe("author");
//   })

//   it("should send a set password email", async() => {
//     expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
//     expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("yesi.amanewauthor@gmail.com");
//     expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Yesi Deeba");
//   })

//   afterAll(async() => {
//     if (createdAuthor) {
//       await prisma.user.delete({
//         where: {
//           id: createdAuthor.id
//         }
//       })
//     }

//     vi.clearAllMocks();
//   })
// })