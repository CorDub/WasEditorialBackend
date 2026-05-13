import express from "express";
import changePassword from "./changePassword.js";

const router = express.Router();

router.use(changePassword);

export default router;