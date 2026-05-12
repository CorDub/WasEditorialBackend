import express from "express";
import getAuthorInventories from "./getAuthorInventories.js";
import getCompleteInventory from "./getCompleteInventory.js";

const router = express.Router();

router.use(getAuthorInventories);
router.use(getCompleteInventory);

export default router;