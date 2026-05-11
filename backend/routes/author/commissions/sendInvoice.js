import express from "express";
import { prisma } from "../../../prisma/client.js";
import multer from "multer";
import { validateInputs } from "../../../utils.js";
import { sendEmailWithInvoice } from "../../../mailer.js";
const router = express.Router();
const upload = multer();

export async function sendInvoice(req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma;

    const userID = req.session.user_id;
    const user = await prismaClient.user.findUnique({
      where: {
        id: userID,
      }
    });

    const inputs = {
      month: req.body.month,
      monthOriginal: req.body.monthOriginal,
      amount: parseFloat(req.body.amount),
      email: user.email,
      factura: req.files.factura[0],
      constancia: req.files.constancia[0]
    }
    validateInputs(inputs)

    const payment = await prismaClient.payment.findUnique({
      where: {
        userId_forMonth: {
          userId: user.id,
          forMonth: inputs.monthOriginal
        }
      }
    })
    if (!payment || payment.status === "solicited" || payment.status === "paid") {
      throw new Error ({error: "invalid payment"})
    }

    const name = user.first_name + " " + user.last_name;
    await sendEmailWithInvoice(
      name,
      inputs.month,
      inputs.amount,
      inputs.factura,
      inputs.constancia,
      inputs.email);

    // if (!info.accepted.includes(inputs.email)) {
    //   throw new Error ({error: "email was not sent successfully"})
    // }

    const updatedPayment = await prismaClient.payment.update({
      where: {
        userId_forMonth: {
          userId: userID,
          forMonth: inputs.monthOriginal
        }
      },
      data: {
        status: "solicited"
      }
    })
    res.status(200).json({message: "invoice sent successfully"})
  } catch (error) {
    console.error("\n ERROR WHILE SENDING INVOICE \n", error);
    res.status(500).json({error: "a server error occurred while sending the invoice"})
  }
}
router.post("/sendInvoice", upload.fields([
  { name: "factura", maxCount: 1},
  { name: "constancia", maxCount: 1}
]), sendInvoice)

export default router;