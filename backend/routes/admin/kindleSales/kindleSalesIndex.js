import express from "express";
import addKindleSale from "./addKindleSale.js";
import deleteKindleSale from "./deleteKindleSales.js";
import getKindleSales from "./getKindleSales.js";
import updateKindleSales from "./updateKindleSale.js";

const router = express.Router();

router.use(addKindleSale);
router.use(deleteKindleSale);
router.use(getKindleSales);
router.use(updateKindleSales);

export default router;