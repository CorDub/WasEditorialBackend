import express from "express";
import commissionRoutes from "./commissions/commissionsIndex.js";
import inventoryRoutes from "./inventories/inventoriesIndex.js";
import passwordRoutes from "./password/passwordIndex.js";
import saleRoutes from "./sales/salesIndex.js";

const router = express.Router();

router.use("/commissions", commissionRoutes);
router.use("/inventories", inventoryRoutes);
router.use("/passwords", passwordRoutes);
router.use("/sales", saleRoutes);

export default router;