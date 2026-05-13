import express from "express";
import inventoriesRoutes from "./inventories/inventoriesIndex.js";
import authorRoutes from "./authors/authorsIndex.js";
import bookRoutes from "./books/booksIndex.js";
import bookstoreRoutes from "./bookstores/bookstoresIndex.js";
import categoryRoutes from "./categories/categoriesIndex.js";
import costRoutes from "./costs/costsIndex.js";
import impressionRoutes from "./impressions/impressionsIndex.js";
import kindleSaleRoutes from "./kindleSales/kindleSalesIndex.js";
import paymentRoutes from "./payments/indexPayments.js";
import saleRoutes from "./sales/indexSales.js";
import transferRoutes from "./transfers/transfersIndex.js";

const router = express.Router();

router.use("/inventories", inventoriesRoutes);
router.use("/authors", authorRoutes);
router.use("/books", bookRoutes);
router.use("/bookstores", bookstoreRoutes);
router.use("/categories", categoryRoutes);
router.use("/costs", costRoutes);
router.use("/impressions", impressionRoutes);
router.use("/kindlesales", kindleSaleRoutes);
router.use("/payments", paymentRoutes);
router.use("/sales", saleRoutes);
router.use("/transfers", transferRoutes);

export default router;

