import { describe, expect, test, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getAuthorSales,
} from "../../routes/authorRoutes.js";
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


describe(`get author sales with valid parameters`, () => {
  let mockReq, mockRes;
  let author;

  beforeAll(async() => {
    author = await createAuthor(prisma, "Sizi", "Urifon", "sizi.urifon@gmail.com", "author")

    mockReq = {
      session: {
        user_id: author.id
      }
    }

    mockRes = {
      query: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-11-04")
      }
    }
  })

  afterAll(async() => {
    await deleteFromDB(prisma, author, "author")
  })

  
})