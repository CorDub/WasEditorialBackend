import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js";
const router = express.Router();

export async function updateCost(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      amount: parseFloat(req.body.amount),
      dateStr: req.body.dateStr,
      note: req.body.note,
      bookId: parseInt(req.body.bookId)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma;

    const cost = await prismaClient.cost.findUnique({where: {id: inputs.id}})
    if (cost.isDeleted) { throw new Error ("deleted cost") }

    await prismaClient.$transaction(async (tx) => {
      const updatedCost = await tx.cost.update({
        where: {
          id: inputs.id
        },
        data: {
          amount: inputs.amount,
          note: inputs.note,
          dateStr: inputs.dateStr,
          bookId: inputs.bookId
        }
      })
    })

    res.status(200).json({message: "The cost was updated successfully"});
  } catch (error) {
    console.error("\n ERROR UPDATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while updating the cost"})
  }
}
router.patch("/cost/:id", updateCost)

export default router;