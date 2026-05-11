import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js" 
const router = express.Router();

export async function deleteSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const deletedSale = await prismaClient.sale.update({where:
      {id: inputs.id},
      data: {
        isDeleted: true
      },
    });

    res.status(200).json({message: "La venta ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the sale'});
  }
}
router.delete('/sale/:id', deleteSale)