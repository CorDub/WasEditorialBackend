import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { updateCategory } from "../../routes/adminRoutes.js";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createPayment,
  createSale,
  createTestDB,
  dropTestDB,
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';

let prisma;
let testDBName;
let deletedCategory, category1, newCategory;
let newAuthor;
let deletedBook, book1, book2;
let deletedBookstore, bookstore1, bookstore2;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();

  category1 = await createCategory(prisma);
  newAuthor = await createAuthor(prisma);
  book1 = await createBook(prisma, [newAuthor.id])
  book2 = await createBook(prisma, [newAuthor.id])
  deletedBook = await createBook(prisma, [newAuthor.id], {isDeleted: true});
  bookstore1 = await createBookstore(prisma)
  bookstore2 = await createBookstore(prisma)
  deletedBookstore = await createBookstore(prisma, {isDeleted: true});
  deletedCategory = await createCategory(prisma, {number: 2, isDeleted: true});
  newCategory = await createCategory(prisma, {number: 3});
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})


// UPDATING
describe("updating a category with valid parameters - type regalias", () => {
  let mockReq, mockRes;
  
    beforeAll(async() => {
      mockReq = {
        params: {
          "id": newCategory.id
        },
        body: {
          "number": 3,
          "type": "regalias",
          "gestionMinima": 200.25,
          "regalias": 20,
          "rebate": 50,
          "gestionTiendas": 5
        },
        prisma: prisma
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
      expect(updatedCategory.number).toBe(3);
      expect(updatedCategory.rebate_author).toBe(50);
      expect(updatedCategory.percentage_royalties).toBe(20);
    })
})



describe("updating a category with valid parameters - type comissions", () => {
  let mockReq, mockRes;
  
    beforeAll(async() => {
      mockReq = {
        params: {
          "id": newCategory.id
        },
        body: {
          "number": 3,
          "type": "comissions",
          "gestionMinima": 200.25,
          "regalias": 20,
          "rebate": 50,
          "gestionTiendas": 5
        },
        prisma: prisma
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
      expect(updatedCategory.number).toBe(3);
      expect(updatedCategory.percentage_management_stores).toBe(5);
      expect(updatedCategory.management_min).toBe(200.25);
    })
})



describe("updating a category with invalid parameters", () => {
  let mockReq, mockRes, mute, updatedCategory;
  
    beforeAll(async() => {
      mockReq = {
        params: {
          "id": category1.id
        },
        body: {
          "tipo": "Updated Omega Premium2",
          "gestionMinima": [],
        },
        prisma: prisma
      }
  
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      }

      mute = vi.spyOn(console, "error").mockImplementation(() => {});
    })

    afterAll(async() => {
      mute.mockRestore()
    })
    
    it("should return status 500", async() => {
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500) 
    })
  
    it("should not update the category", async() => {
      updatedCategory = await prisma.category.findUnique({
        where: {
          id: category1.id
        }
      });
      expect(updatedCategory.number).toBe(category1.number);
      expect(updatedCategory.management_min).toBe(category1.management_min);
    })
})



describe("updating a deleted category", () => {
  let mockReq, mockRes, notUpdatedCategory, mute;
  
    beforeAll(async() => {
      mockReq = {
        params: {
          "id": deletedCategory.id
        },
        body: {
          "number": 5,
          "type": "regalias",
          "gestionMinima": 200.25,
          "regalias": 20
        },
        prisma: prisma
      }
  
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      }

      mute = vi.spyOn(console, "error").mockImplementation(() => {});
    })

    afterAll(async() => { mute.mockRestore() })
    
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
      expect(notUpdatedCategory.number).toBe(deletedCategory.number);
      expect(notUpdatedCategory.management_min).toBe(deletedCategory.management_min);
    })
})