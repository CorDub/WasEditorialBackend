import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
const router = express.Router();

export async function deleteImpression(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);
    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      //1. Check if deleting the impression would make the available copies for this book negative in WAS
      const thisImpression = await tx.impression.findUnique({
        where: {
          id: inputs.id
        }
      })
      
      const thisBookWASInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: thisImpression.bookId,
            bookstoreId: 1
          }
        },
        include: {
          book: {
            include: {
              impressions: true
            }
          },
          bookstore: true,
          sales: true,
          transfersFrom: true,
          transfersTo: true
        }
      })

      if (!thisBookWASInventory || thisBookWASInventory.isDeleted) {
        throw new Error("Este libro no tiene inventario de WAS")
      }

      const derived = getInventoryDerived(thisBookWASInventory)

      if (derived.disponibles < thisImpression.quantity) {
        res.status(400).json({message: "La cantidad de libros imprimidos en esta impresión es superior a la que queda disponible en el inventario de WAS de este libro."})
        return
      }

      //2. mark the impression as deleted
      const updatedImpression = await tx.impression.update({
        where: {id: inputs.id},
        data: {
          isDeleted: true
        }
      })

    res.status(200).json(updatedImpression);
    })
  } catch (error) {
    console.error('\n ERROR WHILE DELETING THE IMPRESSION: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.delete('/impression/:id', deleteImpression);

export default router;