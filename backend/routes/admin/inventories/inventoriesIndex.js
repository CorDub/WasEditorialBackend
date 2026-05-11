import express from "express";
import getInventoriesByBookstoreRoute from "./getInventoriesByBookstore.js";
import getInventoriesByBookRoute from "./getInventoriesByBook.js";
import getBookstoreInventoryRoute from "./getBookstoreInventory.js";
import getBookInventoryRoute from "./getBookInventories.js";

const router = express.Router();

router.use(getInventoriesByBookstoreRoute);
router.use(getInventoriesByBookRoute);
router.use(getBookstoreInventoryRoute);
router.use(getBookInventoryRoute);

export default router;