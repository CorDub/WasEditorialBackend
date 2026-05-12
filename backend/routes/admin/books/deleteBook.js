import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { 
  softDeleteInventoriesOnCascade,
  softDeleteCostsOnCascade,
  softDeleteImpressionsOnCascade 
} from "../softDelete/softDelete.js";
const router = express.Router();

export async function deleteBook(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }
    validateInputs(inputs);

    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;
    await prismaClient.$transaction(async (tx) => {
      const deletedBook = await tx.book.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBook) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([inputs.id], "books", tx);
        // const deletedKindleSales = await softDeleteKindleSalesOnCascade(deletedBook.id, tx);
        const deletedCosts = await softDeleteCostsOnCascade(deletedBook.id, tx);
        // await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        await softDeleteImpressionsOnCascade(deletedBook.id, tx);
      }

      res.status(200).json({message: "El libro ha sido eliminado con exito."})
    })
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the book'});
  }
}
router.delete('/book/:id', deleteBook);

export default router;