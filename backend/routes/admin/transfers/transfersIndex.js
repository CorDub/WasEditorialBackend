import express from "express";
import addTransfer from "./addTransfer.js";
import deleteTransfer from "./deleteTransfer.js";
import getTransfers from "./getTransfers.js";
import updateTransfer from "./updateTransfer.js";

const router = express.Router();

router.use(addTransfer);
router.use(deleteTransfer);
router.use(getTransfers);
router.use(updateTransfer);

export default router;