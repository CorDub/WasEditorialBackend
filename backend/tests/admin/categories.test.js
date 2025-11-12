import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { 
  addCategory,
  getCategories,
  getCategoryTypes,
  deleteCategory,
  updateCategory
 } from "../../routes/adminRoutes.js";
 import { prisma } from '../../prisma/client.js';
 import { 
  createCategory,
  deleteFromDB, 
  createAuthor
} from "../../testUtils.js";

//GETTING
describe("getting all valid categories", () => {
  let mockRes, deletedCategory, jsonResponse;

  beforeAll(async() => {
    deletedCategory = await createCategory(prisma, "So Premium", 400, true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (deletedCategory) {
      await deleteFromDB(prisma, deletedCategory, "category")
    }
  })

  it("should return a list of all valid categories", async() => {
    await getCategories({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
    // expect(jsonResponse.length).toBe(3)
  })

  it("should not contain deleted categories", async() => {
    expect(jsonResponse.includes(deletedCategory)).toBeFalsy()
  })
})

describe("getting all valid category types", () => {
  let mockRes, deletedCategory, jsonResponse;

  beforeAll(async() => {
    deletedCategory = await createCategory(prisma, "So Premium", 400, true);

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })

  afterAll(async() => {
    if (deletedCategory) {
      await deleteFromDB(prisma, deletedCategory, "category")
    }
  })

  it("should return a list of all valid category types", async() => {
    await getCategoryTypes({}, mockRes);
    jsonResponse = mockRes.json.mock.calls[0][0]
    expect(Array.isArray(jsonResponse)).toBe(true);
  })

  it("should only return ids and types", async() => {
    expect(Object.keys(jsonResponse[0])).toStrictEqual(["id", "type"]);
  })

  it("should not contain deleted categories", async() => {
    expect(jsonResponse.includes(deletedCategory)).toBeFalsy()
  })
})

// ADDING
describe("adding a valid category", () => {
  let addedCategory;

  const mockReq = {
    body: {
      "tipo": "Omega Premium",
      "gestionMinima": "180.25",
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  afterAll(async() => {
    if (addedCategory) {
      await deleteFromDB(prisma, addedCategory, "category");
    }
  })

  it("should return status 201 and return json with name", async() => {
    addedCategory = await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": "Omega Premium",
    })
  })

  it("should create the category in the database with the correct data", async() => {
    addedCategory = await prisma.category.findUnique({
      where: {
        type: "Omega Premium"
      }
    })
    expect(addedCategory).toBeTruthy();
    expect(addedCategory.type).toBe("Omega Premium");
    expect(addedCategory.management_min).toBe(180.25);
  })
})


describe("adding an invalid category", () => {
  let mockReq, mockRes, notAddedCategory;

  beforeAll(async() => {
    mockReq = {
      body: {
        "tipo": "Omega Premium",
        "gestionMinima": "",
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  })


  it("should return status 500", async() => {
    await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new category", async() => {
    notAddedCategory = await prisma.category.findUnique({
      where: {
        type: "Omega Premium"
      }
    })
    expect(notAddedCategory).toBeFalsy;
  })

  afterAll(async() => {
    if (notAddedCategory) {
      await deleteFromDB(prisma, notAddedCategory, "category");
    }
  })
})


describe("adding a duplicate category", () => {
  let mockReq, mockRes, previouslyAddedCategory;

  beforeAll(async() => {
    mockReq = {
      body: {
        "tipo": "Omega Premium",
        "gestionMinima": "180.25",
      }
    }; 

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }

    previouslyAddedCategory = await createCategory(prisma, "Omega Premium", 180.25)
  })

  it("should return status 500", async() => {
    await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })

  it("should not create a new category", async() => {
    const premiumCategories = await prisma.category.findMany({
      where: {
        type: "Omega Premium"
      }
    })
    expect(premiumCategories.length).toBe(1);
  })

  afterAll(async() => {
    await deleteFromDB(prisma, previouslyAddedCategory, "category");
  })
})

// UPDATING
describe("updating a category with valid parameters", () => {
  let newCategory, mockReq, mockRes;
  
    beforeAll(async() => {
      newCategory = await prisma.category.create({
        data: {
          type: "Omega Premium",
          management_min: 180.25,
        }
      })
  
      mockReq = {
        params: {
          "id": newCategory.id
        },
        body: {
          "tipo": "Updated Omega Premium",
          "gestionMinima": 200.25,
        }
      }
  
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      }
    })
  
    let updatedCategory;
    
    it("should return status 200", async() => {
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200) 
    })
  
    it("should update the category in the database correctly", async() => {
      updatedCategory = await prisma.category.findUnique({
        where: {
          id: newCategory.id
        }
      });
      expect(updatedCategory.type).toBe("Updated Omega Premium");
      expect(updatedCategory.management_min).toBe(200.25);
    })
  
    afterAll(async() => {
      if (updatedCategory) {
        await prisma.category.delete({
          where: {
            id: updatedCategory.id
          }
        })
        return;
      }
  
      if (newCategory) {
        await prisma.category.delete({
          where: {
            id: newCategory.id
          }
        })
      }
    })
})


describe("updating a category with invalid parameters", () => {
  let newCategory, mockReq, mockRes;
  
    beforeAll(async() => {
      newCategory = await prisma.category.create({
        data: {
          type: "Omega Premium",
          management_min: 180.25,
        }
      })
  
      mockReq = {
        params: {
          "id": newCategory.id
        },
        body: {
          "tipo": "Updated Omega Premium",
          "gestionMinima": [],
        }
      }
  
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      }
    })
  
    let updatedCategory;
    
    it("should return status 500", async() => {
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500) 
    })
  
    it("should not update the category", async() => {
      updatedCategory = await prisma.category.findUnique({
        where: {
          id: newCategory.id
        }
      });
      expect(updatedCategory.type).toBe("Omega Premium");
      expect(updatedCategory.management_min).toBe(180.25);
    })
  
    afterAll(async() => {
      if (updatedCategory) {
        await prisma.category.delete({
          where: {
            id: updatedCategory.id
          }
        })
        return;
      }
  
      if (newCategory) {
        await prisma.category.delete({
          where: {
            id: newCategory.id
          }
        })
      }
    })
})

describe("updating a deleted category", () => {
  let deletedCategory, mockReq, mockRes, notUpdatedCategory;
  
    beforeAll(async() => {
      deletedCategory = await prisma.category.create({
        data: {
          type: "Omega Premium",
          management_min: 180.25,
          isDeleted: true
        }
      })
  
      mockReq = {
        params: {
          "id": deletedCategory.id
        },
        body: {
          "tipo": "Updated Omega Premium",
          "gestionMinima": [],
        }
      }
  
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      }
    })
    
    it("should return status 500", async() => {
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500) 
    })
  
    it("should not update the category", async() => {
      notUpdatedCategory = await prisma.category.findUnique({
        where: {
          id: deletedCategory.id
        }
      });
      expect(notUpdatedCategory.type).toBe("Omega Premium");
      expect(notUpdatedCategory.management_min).toBe(180.25);
    })
  
    afterAll(async() => {
      if (notUpdatedCategory) {
        await prisma.category.delete({
          where: {
            id: notUpdatedCategory.id
          }
        })
        return;
      }
  
      if (deletedCategory) {
        await prisma.category.delete({
          where: {
            id: newCategory.id
          }
        })
      }
    })
})

// DELETING
describe('deleting a category with valid parameters', () => {
  let newCategory;
  let otherCategory;
  let newAuthor;
  let newDeletedAuthor;
  let mockReq;
  let mockRes;

  beforeAll(async() => {
    newCategory = await createCategory(prisma, "Omega Premium", 200.25)
    otherCategory = await createCategory(prisma, "Not so premium", 100.50)
    newAuthor = await createAuthor(prisma, "new", "author", "new.author@gmail.com", "author", {isDeleted: false, categoryId: newCategory.id})
    newDeletedAuthor = await createAuthor(prisma, "newDeleted", "author", "newDeleted.author@gmail.com", "author", {isDeleted: true, categoryId: newCategory.id})

    mockReq = {
      params: {
        id: newCategory.id
      },
      body: {
        selectedCategory: otherCategory.id
      }
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
  });

  afterAll(async() => {
    if (newCategory) {await deleteFromDB(prisma, newCategory, "category")};
    if (otherCategory) {await deleteFromDB(prisma, otherCategory, "category")};
    if (newAuthor) {await deleteFromDB(prisma, newAuthor, "author")};
    if (newDeletedAuthor) {await deleteFromDB(prisma, newDeletedAuthor, 'author')};
  });

  it("should send a 200 status", async() => {
    console.log("otherCategory", otherCategory);
    await deleteCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it("should mark the category as deleted in the database", async() => {
    console.log("newCategory", newCategory);
    const deletedCategory = await prisma.category.findUnique({where: {id: newCategory.id}})
    expect(deletedCategory.isDeleted).toBe(true);
  }) 

  it("should move users from the deleted category to the selected one", async() => {
    const movedAuthor = await prisma.user.findUnique({where: {id: newAuthor.id}});
    expect(movedAuthor.categoryId).toBe(otherCategory.id)
  })

  it("should move deleted users from the deleted category to none", async() => {
    const movedDeletedAuthor = await prisma.user.findUnique({where: {id: newDeletedAuthor.id}});
    expect(movedDeletedAuthor.categoryId).toBe(null)
  })

  ////TO DO - test impact of changing categories on payment values
})