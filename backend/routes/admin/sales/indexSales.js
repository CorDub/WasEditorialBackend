import express from "express";
import addSale from "./addSale.js";
import deleteSale from "./deleteSale.js";
import getSales from "./getSales.js";
import updateSale from "./updateSale.js";

const router = express.Router();

router.use(addSale);
router.use(deleteSale);
router.use(getSales);
router.use(updateSale);

export default router;

