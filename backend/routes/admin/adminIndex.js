import express from "express";
import inventoriesRoutes from "./inventories/inventoriesIndex.js";

const router = express.Router();

router.use("/inventories", inventoriesRoutes);

export default router;

