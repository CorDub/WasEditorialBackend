import express from "express";
import addCost from "./addCost.js";
import deleteCost from "./deleteCost.js";
import getCurrentCosts from "./getCurrentCosts.js";
import updateCost from "./updateCost.js";

const router = express.Router();

router.use(addCost);
router.use(deleteCost);
router.use(getCurrentCosts);
router.use(updateCost);

export default router;