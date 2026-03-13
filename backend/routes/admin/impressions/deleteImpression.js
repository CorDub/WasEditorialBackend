import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
const router = express.Router();

export async function deleteImpression(req, res) {
  try {
    // const impression_id = parseInt(req.params.id);
    // const book_id = parseInt(req.query.book_id);
    // const quantity = parseInt(req.query.quantity);
    const inputs = {
      id: parseInt(req.params.id)
    }
    validateInputs(inputs);
    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const updatedImpression = await tx.impression.update({
        where: {id: inputs.id},
        data: {
          isDeleted: true
        }
      })

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: updatedImpression.bookId,
            bookstoreId: 1
          }
        }
      });

      // if (wasInventory && !wasInventory.isDeleted) {
      //   const updatedInventory = await tx.inventory.update({
      //     where: {id: wasInventory.id},
      //     data: {
      //       current: wasInventory.current - updatedImpression.quantity,
      //       // initial: wasInventory.initial - updatedImpression.quantity
      //     }
      //   })
      // }

    res.status(200).json(updatedImpression);
    })
  } catch (error) {
    console.error('\n ERROR WHILE DELETING THE IMPRESSION: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.delete('/impression/:id', deleteImpression);

export default router;