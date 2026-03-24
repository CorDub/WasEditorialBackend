import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { getInventoryDerived } from "../inventories/inventoryHelpers.js"; 
const router = express.Router();

export async function updateImpression(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      quantity: parseInt(req.body.quantity),
      bookId: parseInt(req.body.book_id),
      note: req.body.note,
      dateStr: req.body.dateStr,
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      // const currentImpression = await tx.impression.findUnique({ where: {id: inputs.id}});
      // const diff = inputs.quantity - currentImpression.quantity;
      
      //1. Check if deleting the impression would make the available copies for this book negative in WAS
      const thisImpression = await tx.impression.findUnique({
        where: {
          id: inputs.id
        }
      })
      
      // we only check if the new number is smaller than previous, adding more copies is fine
      let left = 0
      if (thisImpression.quantity > inputs.quantity) {
        left = thisImpression.quantity - inputs.quantity;

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

        if (derived.disponibles < left) {
          res.status(400).json({message: "No se puede reducir la cantidad de libros imprimidos a menos de lo que queda disponible en el inventario de WAS de este libro."})
          return
        }
      }

      const updatedImpression = await tx.impression.update({
        where: {id: inputs.id},
        data: {
          quantity: inputs.quantity,
          dateStr: inputs.dateStr,
          note: inputs.note
        }
      });

      // const wasInventory = await tx.inventory.findUnique({
      //   where: {
      //     bookId_bookstoreId: {
      //       bookId: inputs.bookId,
      //       bookstoreId: 1
      //     }
      //   }
      // });

      // if (wasInventory && !wasInventory.isDeleted) {
      //   const updatedInventory = await tx.inventory.update({
      //     where: {id: wasInventory.id},
      //     data: {
      //       current: wasInventory.current + diff,
      //       initial: wasInventory.initial + diff
      //     }
      //   })
      // }

      res.status(200).json(updatedImpression);
    })

  } catch(error) {
    console.error('\n ERROR WHILE UPDATING THE IMPRESSI0N: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.patch('/impression/:id', updateImpression);

export default router;