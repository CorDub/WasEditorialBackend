import express from "express";
import addImpression from "./addImpression.js";
import deleteImpression from "./deleteImpression.js";
import updateImpression from "./updateImpression.js";

const router = express.Router();

router.use(addImpression);
router.use(deleteImpression);
router.use(updateImpression);

export default router;