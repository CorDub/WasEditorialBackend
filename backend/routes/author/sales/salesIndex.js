import express from "express";
import getAuthorSales from "./getAuthorSales.js";

const router = express.Router();

router.use(getAuthorSales);

export default router;