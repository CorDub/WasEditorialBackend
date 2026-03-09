import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  getOtherInventory,
  getWasInventory
} from "../../admin/inventories/inventoryHelpers.js"
const router = express.Router();

export async function getCompleteInventory(req, res) {
  try {
    if (!req.session.user_id) {
      return res.status(401).json({message: "Unauthorized"})
    }

    const prismaClient = req.prisma || prisma

    const allAuthorInventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false,
        book: {
          users: {
            some: {
              id: req.session.user_id
            }
          }
        }
      },
      select: {
        book: {
          select: {
            id: true,
            title: true,
            impressions: true
          },
        },
        bookstore: {
          select: {
            id: true,
            name: true,
          }
        },
        bookId: true,
        bookstoreId: true,
        sales: {
          select: {
            isDeleted: true,
            quantity: true,
          }
        },
        transfersTo: true,
        transfersFrom: true
      }
    });

    let inventoriesWithSales = [];
    for (const inventory of allAuthorInventories) {
      let totalSold = 0;
      for (const sale of inventory.sales) {
        if (sale.isDeleted) {continue}

        totalSold += sale.quantity
      }

      let currentForThisInventory = 0;
      let returnsForThisInventory = 0;
      let givenToAuthorForThisInventory = 0;
      if (inventory.bookstoreId === 1) {
        const wasRes = getWasInventory(inventory)
        currentForThisInventory = wasRes.disponibles
        returnsForThisInventory = wasRes.returns
        givenToAuthorForThisInventory = wasRes.entregadosAlAutor
      } else {
        const otherRes = getOtherInventory(inventory)
        currentForThisInventory = otherRes.disponibles
        returnsForThisInventory = otherRes.returns
      }

      inventoriesWithSales.push({
        book: {
          id: inventory.book.id,
          title: inventory.book.title
        },
        bookstore: {
          id: inventory.bookstore.id,
          name: inventory.bookstore.name
        },
        current: currentForThisInventory,
        givenToAuthor: givenToAuthorForThisInventory,
        returns: returnsForThisInventory,
        sold: totalSold
      })
    }

    res.status(200).json(inventoriesWithSales);
  } catch (error) {
    console.log("\n ERROR WHILE FETCHING PAYMENTS FROM SERVER \n", error);
    res.status(500).json({error: "a server error occurred while fetching the complete inventory status of the author"})
  }
}
router.get("/completeInventory", getCompleteInventory)

export default router;