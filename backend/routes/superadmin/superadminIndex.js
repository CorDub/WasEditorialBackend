import express from "express";
import addAdmin from "./addAdmin.js";
import deleteAdmin from "./deleteAdmin.js";
import getAdmins from "./getAdmins.js";
import updateAdmin from "./updateAdmin.js";

const router = express.Router();

router.use(addAdmin);
router.use(deleteAdmin);
router.use(getAdmins);
router.use(updateAdmin);

export default router;