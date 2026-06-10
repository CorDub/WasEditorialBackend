import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
import { validateAuthorReturn } from "../impressions/impressionHelpers.js";
const router = express.Router();

export async function updateTransfer(req, res) {
  try {
    //1. validate inputs
    const inputs = {
      id: parseInt(req.params.id),
      inventoryToId: req.body.inventoryToId ? parseInt(req.body.inventoryToId) : null,
      quantity: parseInt(req.body.quantity),
      inventoryFromId: req.body.fromInventoryId ? parseInt(req.body.inventoryFromId) : null,
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

    let result = null;

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

      //2.1 if no inventoryFrom it's a return from author
      if (!inputs.inventoryFromId) {
        const inventoryTo = await tx.inventory.findUnique({
          where: {
            id: inputs.inventoryToId
          }
        })

        const valid = await validateAuthorReturn(tx, inventoryTo.bookId, inventoryTo.bookstoreId, inputs.quantity)
        if (!valid) {
          throw new Error("cannot return more books than were delivered to author")
        }

        const editedTransfer = await tx.transfer.update({
          where: {
            id: inputs.id
          },
          data: {
            quantity: inputs.quantity,
            dateStr: inputs.dateStrOptional,
            note: inputs.note,
          }
        })

        // return res.status(200).json({message:"successfully edited the return from author"})
        result = {
          status: 200,
          message: "successfully edited the return from author"
        }
        return
      }

      // back to any other cases
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
        result = {
          status: 400,
          message: `No hay suficientes libros en el inventario. Libros disponibles: ${derived.disponibles}`
        }
        return
      }

      //4. Check that you can't have less sends than returns
      if (inventoryFrom.bookstoreId === 1) {
        if (transferToBeEdited.toInventoryId && inventoryFrom.transfersTo.length > 0) {
          // check the total amount of send left after taking out this transfer's quantity
          let totalQuantitySentLeft = 0;
          for (const send of inventoryFrom.transfersFrom) {
            if (!send.isDeleted) {
              if (send.id === transferToBeEdited.id) {
                totalQuantitySentLeft += inputs.quantity
              } else {
                totalQuantitySentLeft += send.quantity
              }
            }
          }

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
              if (sent.id === transferToBeEdited.id) {
                totalQuantitySentLeft += inputs.quantity
              } else {
                totalQuantitySentLeft += sent.quantity
              }
            }
          }

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

    if (invalidRequestLibreria) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de esta librería. No se puede tener menos libros en ingresos que en devoluciones. Por favor edite o elimine las devoluciones.`})
      return
    }

    if (invalidRequestAuthor) {
      res.status(400).json({error: `Quedan ${totalReturns} devoluciones de este autor. No se puede tener menos libros en entrega que en devoluciones. Por favor edite o elimine las devoluciones.`})
      return
    }

    if (result) {
      res.status(result.status).json({message: result.message})
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