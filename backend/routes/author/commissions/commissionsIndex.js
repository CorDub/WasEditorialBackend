import express from "express";
import getAuthorPayments from "./getAuthorPayments.js";
import getMonthlySalesByPayment from "./getMonthlySalesByPayment.js";
import sendInvoice from "./sendInvoice.js";

const router = express.Router();

router.use(getAuthorPayments);
router.use(getMonthlySalesByPayment);
router.use(sendInvoice);

export default router;