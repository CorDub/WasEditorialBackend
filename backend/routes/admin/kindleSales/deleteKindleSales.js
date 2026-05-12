import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js";
const router = express.Router();

export async function deleteKindleSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id)
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    const deletedKindleSale = await prismaClient.kindleSale.update({
      where: {
        id: inputs.id
      },
      data: {
        isDeleted: true
      }
    })

    res.status(200).json({message: "successfully deleted the kindle sale"})
  } catch(error) {
    console.error("error at deleting kindlesales ", error);
    res.status(500).json({error: "Server error while deleting the kindle sale"})
  }
}
router.delete("/kindlesales/:id", deleteKindleSale)

export default router;
