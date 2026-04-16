import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
const router = express.Router();

export async function updateTransfer(req, res) {
  try {
    //1. validate inputs
    const inputs = {
      id: parseInt(req.params.id),
      inventoryToId: req.body.toInventoryId ? parseInt(req.body.toInventoryId) : null,
      quantity: parseInt(req.body.quantity),
      inventoryFromId: parseInt(req.body.inventoryFromId),
      type: req.body.type,
      note: req.body.note || null,
      dateStrOptional: req.body.dateStr || null,
      place: req.body.place || null,
      person: req.body.person || null
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    let invalidRequestLibreria = false;
    let invalidRequestAuthor = false;
    let totalReturns = 0;

    await prismaClient.$transaction(async (tx) => {
      //2. get the previous transfer and inventory From
      const transferToBeEdited = await tx.transfer.findUnique({
        where: {
          id: inputs.id
        },
        include: {
          toInventory: true
        }
      })

      if (transferToBeEdited.isDeleted) {
        throw new Error("deleted transfer")
      }

      const inventoryFrom = await tx.inventory.findUnique({
        where: {
          id: transferToBeEdited.fromInventoryId
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

      if (inventoryFrom.isDeleted) {
        throw new Error("deleted inventory from")
      }

      //3. Check that the new quantity is not more than available in the inventory
      const derived = getInventoryDerived(inventoryFrom)
      const quantityUpdate = transferToBeEdited.quantity - inputs.quantity
      if ((derived.disponibles + quantityUpdate) < 0) {
        return res.status(400).json({message: `No hay suficientes libros en el inventario. Libros disponibles: ${derived.disponibles}`})
      }

      //4. Check that you can't have less sends than returns
      if (inventoryFrom.bookstoreId === 1) {
        if (transferToBeEdited.toInventoryId && inventoryFrom.transfersTo.length > 0) {
          // check the total amount of send left after taking out this transfer's quantity
          let totalQuantitySentLeft = 0;
          for (const send of inventoryFrom.transfersFrom) {
            if (!send.isDeleted) {
              totalQuantitySentLeft += send.quantity
            }
          }
          totalQuantitySentLeft -= quantityUpdate

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
        } else {
          // the delivery to author case
          //same process, get the total amount sent - this transfer first
          let totalQuantitySentLeft = 0;
          for (const sent of inventoryFrom.transfersFrom) {
            if (!sent.isDeleted && !sent.toInventoryId) {
              totalQuantitySentLeft += sent.quantity
            }
          }
          totalQuantitySentLeft -= quantityUpdate

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

      //5. finally update the transfer
      const updatedTransfer = await tx.transfer.update({
        where: {
          id: transferToBeEdited.id
        },
        data: {
          quantity: inputs.quantity,
          dateStr: inputs.dateStrOptional,
          note: inputs.note,
          place: inputs.place,
          person: inputs.person
        }
      })
    })

    console.log("invalidrequestLibreria", invalidRequestLibreria)
    console.log("invalidRequestAuthor", invalidRequestAuthor)
    console.log("totalReturns", totalReturns)

    if (invalidRequestLibreria) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de esta librería. No se puede tener menos libros en ingresos que en devoluciones. Por favor edite o elimine las devoluciones.`})
      return
    }

    if (invalidRequestAuthor) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de este autor. No se puede tener menos libros en entrega que en devoluciones. Por favor edite o elimine las devoluciones.`})
      return
    }

    res.status(200).json({message: "successfully edited the transfer"})
    
  } catch(error) {
    console.error("\n ERROR WHILE UPDATING TRANSFER \n", error);
    res.status(500).json({error: "a server error occurred while updating the transfer"})
  }
}
router.patch('/transfer/:id', updateTransfer)

export default router;