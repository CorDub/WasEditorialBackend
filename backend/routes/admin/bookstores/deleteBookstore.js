import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function deleteBookstore(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      // Clean out the TBD inventories by sending remaining copies to the WAS inventory
      const inventoriesToBeDeleted = await tx.inventory.findMany({
        where: {
          bookstoreId: inputs.id
        },
        include: {
          sales: true
        }
      });

      for (const inventory of inventoriesToBeDeleted) {
        // Get the Was inventory equivalent
        let finalInventoryForThatBook;
        const WasInventoryForThatBook = await tx.inventory.findUnique({
          where: {
            bookId_bookstoreId: {
              bookId: inventory.bookId,
              bookstoreId: 1
            }
          }
        })

        if (WasInventoryForThatBook && !WasInventoryForThatBook.isDeleted) {finalInventoryForThatBook = WasInventoryForThatBook}

        if (!WasInventoryForThatBook) {
          const newWasInventoryForThatBook = await tx.inventory.create({
            data: {
              bookId: inventory.bookId,
              bookstoreId: 1
            }
          })
          finalInventoryForThatBook = newWasInventoryForThatBook
        }

        if (WasInventoryForThatBook && WasInventoryForThatBook.isDeleted) {
          const deletedWasInventory = await tx.inventory.delete({where: {id: WasInventoryForThatBook.id}})
          const recreatedWasInventoryForThatBook = await tx.inventory.create({
            data: {
              bookId: inventory.bookId,
              bookstoreId: 1
            }
          })
          finalInventoryForThatBook = recreatedWasInventoryForThatBook;
        }

        // Create transfer
        const newTransfer = await tx.transfer.create({
          data: {
            fromInventoryId: inventory.id ,
            toInventoryId: finalInventoryForThatBook.id,
            quantity: inventory.current,
            type: "return"
          }
        })

        // Move the sales from old inventory to was inventory so they keep appearing
        for (const sale of inventory.sales) {
          const updatedSale = await tx.sale.update({
            where: {
              id: sale.id
            },
            data: {
              inventoryId: finalInventoryForThatBook.id
            }
          })
        }
      }

      const deletedBookstore = await tx.bookstore.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBookstore) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([inputs.id], "bookstores", tx);
        // await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
      }

      res.status(200).json({message: "La libreria ha sido eliminada con exito."})
    })

  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the bookstore'});
  }
}
router.delete('/bookstore/:id', deleteBookstore);

export default router;