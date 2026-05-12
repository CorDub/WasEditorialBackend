import express from "express"; 
import getPayments from "./getPayments.js";
import markPaymentAsPaid from "./markPaymentAsPaid.js";

const router = express.Router();

router.use(getPayments);
router.use(markPaymentAsPaid);

export default router;