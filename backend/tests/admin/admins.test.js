import { describe, expect, vi, it, afterAll, beforeAll } from "vitest";
import { addAdmin, updateAdmin, deleteAdmin } from "../../routes/superAdminRoutes.js";
import { prisma } from "../../prisma/client.js";
import * as mailer from "../../mailer.js";
vi.mock('../mailer.js', () => ({
  sendSetPasswordMail: vi.fn(),
}));

////ADDING 
describe("adding a valid admin", () => {
  const mockReq = {
    body: {
      "firstName": "Iama",
      "lastName": "Newadmin",
      "email": "iama.newadmin@gmail.com",
      "role": "admin"
    }
  }

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  let createdAdmin;

  it(`should return status 201 and
    return an object with firstName, lastName and email,`, async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Iama",
      "lastName": "Newadmin",
      "email": 'iama.newadmin@gmail.com',
    })
  })

  it("should create the user in the database with the correct data", async() => {
    createdAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Iama",
          last_name: "Newadmin"
        }
      }
    });
    expect(createdAdmin).toBeTruthy();
    expect(createdAdmin.first_name).toBe("Iama");
    expect(createdAdmin.last_name).toBe("Newadmin");
    expect(createdAdmin.email).toBe("iama.newadmin@gmail.com");
    expect(createdAdmin.role).toBe("admin");
  })

  it("should send a set password email", async() => {
    expect(mailer.sendSetPasswordMail).toHaveBeenCalled();
    expect(mailer.sendSetPasswordMail.mock.calls[0][0]).toBe("iama.newadmin@gmail.com");
    expect(mailer.sendSetPasswordMail.mock.calls[0][1]).toBe("Iama");
  })

  afterAll(async() => {
    if (createdAdmin) {
      await prisma.user.delete({
        where: {
          id: createdAdmin.id
        }
      })
    }

    vi.clearAllMocks();
  })
}) 

describe("adding an invalid admin", () => {
  let mockReq, mockRes, notAddedAdmin;
  mockReq = {
    body: {
      "firstName": "Iama",
      "email": "iama.newadmin@gmail.com",
      "role": "admin"
    }
  }

  mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 500", async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create an admin", async() => {
    notAddedAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Iama",
          last_name: "Newadmin"
        }
      }
    })
    expect(notAddedAdmin).toBeFalsy();
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    if (notAddedAdmin) {
      await prisma.user.delete({
        where: {
          id: notAddedAdmin.id
        }
      })
    }

    vi.clearAllMocks();
  })
})

describe("adding a duplicate admin (already a user)", () => {
  let mockReq, mockRes, newAdmin;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        "first_name": "Iama",
        "last_name": "Newadmin",
        "email": "iama.newadmin@gmail.com",
        "role": "admin"
      }
    })

    mockReq = {
      body: {
        "firstName": "Iama",
        "lastName": "Newadmin",
        "email": "iama.newadmin@gmail.com",
        "role": "admin"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let notAddedAdmin;

  it("should return status 409 and return an object with firstName, lastName and email", async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(409);
  })

  it("should not create an admin", async() => {
    notAddedAdmin = await prisma.user.findUnique({
      where: {
        first_name_last_name: {
          first_name: "Iama",
          last_name: "Newadmin"
        }
      }
    })
    expect(notAddedAdmin.id).toBe(newAdmin.id);
  })

  it("should not send a password email", async() => {
    expect(mailer.sendSetPasswordMail).not.toHaveBeenCalled();
  })

  afterAll(async() => {
    if (notAddedAdmin) {
      await prisma.user.delete({
        where: {
          id: notAddedAdmin.id
        }
      })
      return;
    }

    if (newAdmin) {
      await prisma.user.delete({
        where: {
          id: newAdmin.id
        }
      })
    }

    vi.clearAllMocks();
  })
}) 

///UPDATING
describe("updating an admin with valid parameters", () => {
  let newAdmin, mockReq, mockRes;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin"
      }
    })

    mockReq = {
      params: {
        "id": newAdmin.id
      },
      body: {
        "firstName": "Updated",
        "lastName": 'Admin',
        "email": "updated.admin@gmail.com",
        "role": "admin"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  let updatedAdmin;
  
  it("should return status 200", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200) 
  })

  it("should update the admin in the database correctly", async() => {
    updatedAdmin = await prisma.user.findUnique({
      where: {
        id: newAdmin.id
      }
    });
    expect(updatedAdmin.first_name).toBe("Updated");
    expect(updatedAdmin.last_name).toBe("Admin");
    expect(updatedAdmin.email).toBe("updated.admin@gmail.com");
    expect(updatedAdmin.role).toBe("admin");
  })

  afterAll(async() => {
    if (updatedAdmin) {
      await prisma.user.delete({
        where: {
          id: updatedAdmin.id
        }
      })
      return;
    }

    if (newAdmin) {
      await prisma.user.delete({
        where: {
          id: newAdmin.id
        }
      })
    }
  })
})

describe("updating an admin with invalid parameters", () => {
  let mockReq, mockRes, newAdmin;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin"
      }
    })

    mockReq = {
      params: {
        "id": newAdmin.id
      },
      body: {
        "firstName": 200,
        "lastName": [],
        "email": "thiissupposedtobeanemail",
        "role": "admin"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  let updatedAdmin;

  afterAll(async () => {
    if (updatedAdmin) {
      await prisma.user.delete({
        where: {
          id: updatedAdmin.id
        }
      })
      return;
    }
    
    if (newAdmin) {
      await prisma.user.delete({
        where: {
          id: newAdmin.id
        }
      })
    }
  });

  it("should return status 500", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not update the admin", async() => {
    updatedAdmin = await prisma.user.findUnique({
      where: {
        id: newAdmin.id
      }
    })
    expect(updatedAdmin.first_name).toBe("New");
    expect(updatedAdmin.last_name).toBe("Admin");
    expect(updatedAdmin.email).toBe("new.admin@gmail.com");
    expect(updatedAdmin.role).toBe("admin");
  })
})

describe("updating a deleted admin", () => {
  let deletedAdmin, mockReq, mockRes, notUpdatedAdmin;

  beforeAll(async() => {
    deletedAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin",
        isDeleted: true
      }
    });

    mockReq = {
      params: {
        "id": deletedAdmin.id
      },
      body: {
        "firstName": "Updated",
        "lastName": 'Admin',
        "email": "updated.admin@gmail.com",
        "role": "admin"
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (notUpdatedAdmin) {
      await prisma.user.delete({
        where: {
          id: notUpdatedAdmin.id
        }
      })
      return;
    }

    if (deletedAdmin) {
      await prisma.user.delete({
        where: {
          id: deletedAdmin.id
        }
      })
    }
  })

  it("should return status 500 and message", async() => {
    await updateAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "User has been deleted"})
      })
    )
  })

  it('should not update the admin', async() => {
    notUpdatedAdmin = await prisma.user.findUnique({
      where: {
        id: deletedAdmin.id
      }
    });
    expect(notUpdatedAdmin.first_name).toBe("New");
    expect(notUpdatedAdmin.last_name).toBe("Admin")
    expect(notUpdatedAdmin.email).toBe("new.admin@gmail.com")
    expect(notUpdatedAdmin.role).toBe("admin")
    expect(notUpdatedAdmin.isDeleted).toBe(true)
  })
  
})

///DELETING
describe('deleting an admin with valid parameters', () => {
  let newAdmin, mockReq, mockRes;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin"
      }
    });

    mockReq = {
      params: {
        "id": newAdmin.id
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  let deletedAdmin;

  afterAll(async () => {
    if (deletedAdmin) {
      await prisma.user.delete({
        where: {
          id: deletedAdmin.id
        }
      })
      return;
    }
    
    if (newAdmin) {
      await prisma.user.delete({
        where: {
          id: newAdmin.id
        }
      })
    }
  });

  it("should return status 200 and mark the admin as deleted", async() => {
    await deleteAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })

  it("should mark the admin as deleted in the database", async() => {
    deletedAdmin = await prisma.user.findUnique({
      where: {
        id: mockReq.params.id
      },
    })
    expect(deletedAdmin.isDeleted).toBe(true)
  })
})

describe('deleting an admin with invalid parameters', () => {
  let newAdmin, mockReq, mockRes;

  beforeAll(async() => {
    newAdmin = await prisma.user.create({
      data: {
        first_name: "New",
        last_name: "Admin",
        email: "new.admin@gmail.com",
        role: "admin"
      }
    });

    mockReq = {
      params: {
        "id": "thisisanid"
      }
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  let deletedAdmin;

  afterAll(async () => {
    if (deletedAdmin) {
      await prisma.user.delete({
        where: {
          id: deletedAdmin.id
        }
      })
      return;
    }
    
    if (newAdmin) {
      await prisma.user.delete({
        where: {
          id: newAdmin.id
        }
      })
    }
  });

  it("should return status 500", async() => {
    await deleteAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not mark the admin as deleted in the database", async() => {
    expect(newAdmin.isDeleted).toBe(false);
  })
})