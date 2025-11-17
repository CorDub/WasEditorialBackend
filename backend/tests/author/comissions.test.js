import { describe, expect, test, vi, it, beforeAll, afterAll } from "vitest";
import { 
  getMonthlySalesByPayments,
  getAuthorPayments,
  sendInvoice,
  getAuthorCosts
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