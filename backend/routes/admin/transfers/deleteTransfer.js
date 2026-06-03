import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js" 
const router = express.Router();

export async function deleteTransfer(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    let invalidRequestLibreria = false;
    let invalidRequestAuthor = false;
    let totalReturns = 0;

    await prismaClient.$transaction(async (tx) => {
      const transferToBeDeleted = await tx.transfer.findUnique({where: {id: inputs.id}})

      const inventoryFrom = await tx.inventory.findUnique({
        where: {
          id: transferToBeDeleted.fromInventoryId
        },
        include: {
          transfersFrom: true,
          transfersTo: true
        }
      })

      // If it's a send, make sure no return is associated to it
      if (inventoryFrom.bookstoreId === 1) {
        if (transferToBeDeleted.toInventoryId) {
          if (inventoryFrom.transfersTo.length > 0) {
            // check the total amount of send left after taking out this transfer's quantity
            let totalQuantitySentLeft = 0;
            for (const send of inventoryFrom.transfersFrom) {
              if (!send.isDeleted) {
                totalQuantitySentLeft += send.quantity
              }
            }
            totalQuantitySentLeft -= transferToBeDeleted.quantity

            // get total amount returned
            let totalQuantityReturned = 0;
            for (const transferBack of inventoryFrom.transfersTo) {
              if (!transferBack.isDeleted) {
                totalQuantityReturned += transferBack.quantity
              }
            }
            
            // compare
            if (totalQuantitySentLeft < totalQuantityReturned) {
              invalidRequestLibreria = true;
              totalReturns = totalQuantityReturned;
              return;
            }
          }
        } else {
          // the delivery to author case
          //same process, get the total amount sent - this transfer first
          let totalQuantitySentLeft = 0;
          for (const sent of inventoryFrom.transfersFrom) {
            if (!sent.isDeleted && !sent.toInventoryId) {
              totalQuantitySentLeft += sent.quantity
            }
          }
          totalQuantitySentLeft -= transferToBeDeleted.quantity

          // get total amount returned
          const thatBookAuthorDeliveries = await tx.impression.findMany({
            where: {
              bookId: inventoryFrom.bookId,
              authorDelivery: true,
              isDeleted: false
            }
          })

          let totalQuantityReturned = 0;
          for (const authorDelivery of thatBookAuthorDeliveries) {
            totalQuantityReturned += authorDelivery.quantity
          }

          //compare
          if (totalQuantitySentLeft < totalQuantityReturned) {
            invalidRequestAuthor = true;
            totalReturns = totalQuantityReturned;
            return
          }
        }
      }

      const deletedTransfer = await tx.transfer.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        },
      });
    }) 

    if (invalidRequestLibreria) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de esta librería. No se puede eliminar este ingreso sin eliminar las devoluciones primero.`})
      return
    }

    if (invalidRequestAuthor) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de este autor. No se puede eliminar esta entrega al autor sin eliminar las devoluciones primero.`})
      return
    }

    res.status(200).json({message: "El movimiento ha sido eliminado con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the sale'});
  }
}
router.delete('/transfer/:id', deleteTransfer)

export default router;