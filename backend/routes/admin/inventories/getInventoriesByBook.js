import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();
import { 
  getTotalWasImpressions, 
  getTotalSales,
  getGivenToAuthor,
} from "./inventoryHelpers.js";

export async function getInventoriesByBook(req, res) {
  try {
    const prismaClient = req.prisma || prisma

    //1: get the data
    const inventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        book: {
          select: {
            title: true,
            impressions: {
              orderBy: {
                date: 'asc',
              },
              where: {
                isDeleted: false
              },
              select: {
                id: true,
                quantity: true,
                isDeleted: true,
                authorDelivery: true
              }
            }
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true
          }
        },
        bookstoreId: true,
        sales: {
          where: {
            isDeleted: false
          },
          select: {
            quantity: true,
            isDeleted: true,
          }
        },
        transfersFrom: {
          where: {
            isDeleted: false
          },
          select: {
            isDeleted: true,
            toInventoryId: true,
            id: true,
            quantity: true
          }
        },
      }
    })

    //2: loop
    const resMap = new Map()
    for (const inventory of inventories) {
      const scaffold = {
        id: 0,
        name: "",
        impressionInicial: 0,
        extraImpressions: 0,
        ventas: 0,
        entregadosDelAutor: 0,
        entregadosAlAutor: 0,
        disponibles: 0,
        type: "book"
      }

      scaffold.name = inventory.book.title
      scaffold.id = inventory.bookId

      //2.1 impressions
      const impressions = getTotalWasImpressions(inventory);
      scaffold.impressionInicial += impressions.impressionInicial
      scaffold.extraImpressions += impressions.extraImpressions
      scaffold.entregadosDelAutor += impressions.entregadosDelAutor

      //2.2 ventas
      const ventas = getTotalSales(inventory)
      scaffold.ventas += ventas

      //2.3 entregadosAlAutor
      const givenToAuthor = getGivenToAuthor(inventory)
      scaffold.entregadosAlAutor += givenToAuthor
      
      //2.5 triage
      if (resMap.has(inventory.bookId)) {
        const targetedBook = resMap.get(inventory.bookId)
        targetedBook.ventas += scaffold.ventas
        targetedBook.entregadosAlAutor += scaffold.entregadosAlAutor
      } else {
        resMap.set(inventory.bookId, scaffold) 
      }
    }

    //3. get disponibles
    let finalRes = []
    for (const book of resMap.values()) {
      let bookWithDisponibles = book
      bookWithDisponibles.disponibles = 
        book.impressionInicial 
        + book.extraImpressions
        - book.ventas
        + book.entregadosDelAutor
        - book.entregadosAlAutor
      finalRes.push(bookWithDisponibles)     
    }

    res.status(200).json(finalRes)

  } catch (error) {
    console.error(error)
    res.status(500).json({error: "Server error fetching inventories"});
  }
}
router.get("/inventories/inventoriesByBook", getInventoriesByBook);

export default router;