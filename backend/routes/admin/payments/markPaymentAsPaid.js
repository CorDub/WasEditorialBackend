import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js";
const router = express.Router();

export async function markPaymentAsPaid(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const now = new Date()
    const paymentToUpdate = await prismaClient.payment.findUnique({where: {id: inputs.id}})
    if (paymentToUpdate && paymentToUpdate.isDeleted) {throw new Error("deleted payment")};
    if (paymentToUpdate && paymentToUpdate.status === "created") {throw new Error("not solicited yet")};
    if (paymentToUpdate && paymentToUpdate.status === "paid") {throw new Error("already paid")};

    const updatedPayment = await prismaClient.payment.update({
      where: {
        id: inputs.id
      },
      data: {
        status: 'paid',
        dateMarkedAsPaid: now
      }
    })

    res.status(200).json({message: "Successfully marked payment as paid"})
  } catch(error) {
    console.error("\n ERROR MARKING PAYMENT AS PAID \n", error);
    res.status(500).json({error:"a server error occurred while updating payments"})
  }
}
router.patch('/markAsPaid/:id', markPaymentAsPaid);

export default router;