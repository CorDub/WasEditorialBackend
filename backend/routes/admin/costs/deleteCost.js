import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils";
const router = express.Router();

export async function deleteCost(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id)
    }

    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      const markedAsDeletedCost = await tx.cost.update({
        where: {
          id: inputs.id
        },
        data: {
          isDeleted: true
        }
      });
    })

    res.status(200).json({message: "The cost was deleted successfully"});
  } catch (error) {
    console.error("\n ERROR DELETING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while deleting the cost"})
  }
}
router.delete('/cost/:id', deleteCost)

export default router;