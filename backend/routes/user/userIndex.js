import express from "express";
import getConfirmationCode from "./getConfirmationCode.js";
import getReset from "./getReset.js";
import getUserExtra from "./getUserExtra.js";
import login from "./login.js";
import logout from "./logout.js";
import updateUser from "./updateUser.js";

const router = express.Router();

router.use(getConfirmationCode);
router.use(getReset);
router.use(getUserExtra);
router.use(login);
router.use(logout);
router.use(updateUser);

export default router;