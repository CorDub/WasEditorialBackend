import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import {
  getTotalWasImpressions,
  getTotalSales,
  getTotalWasTransfers,
  getNonWasTransfers
} from "./inventoryHelpers.js"
const router = express.Router();

export async function getBookInventory(req, res) {
  try {
    //1.validate inputs
    const inputs = {
      'id': parseInt(req.params.id)
    }
    validateInputs(inputs);

    //2. db query
    const prismaClient = req.prisma || prisma
    const thatBookInventories = await prismaClient.inventory.findMany({
      where: {
        bookId: inputs.id,
        isDeleted: false
      },
      select: {
        id: true,
        bookstore: {
          select: {
            name: true,
            wasRed: true
          }
        },
        bookstoreId: true,
        book: {
          select: {
            title: true,
            impressions: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                dateStr: "asc"
              },
              select: {
                id: true,
                quantity: true,
                note: true,
                authorDelivery: true,
                date: true,
                dateStr: true
              }
            }
          }
        },
        bookId: true,
        sales: {
          where: {
            isDeleted: false
          },
          select: {
            quantity: true,
          }
        },
        transfersFrom: {
          where: {
            isDeleted: false,
          }, 
          select: {
            quantity: true,
            toInventoryId: true,
            fromInventoryId: true,
          }
        },
        transfersTo: {
          where: {
            isDeleted: false,
          },
          select: {
            quantity: true,
            toInventoryId: true,
            fromInventoryId: true,
          }
        }
      }
    })

    //3.loop
    let total = {
      name: thatBookInventories[0].book.title,
      copias: 0,
      impressionInicial: 0,
      extraImpressions: 0,
      entregadosDelAutor: 0,
      entregadosAlAutor: 0,
      ventas: 0,
      disponibles: 0,
      id: thatBookInventories[0].bookId,
      thatBookImpressions: []
    }
    let specifics = []

    for (const inventory of thatBookInventories) {
      if (inventory.isDeleted) {
        console.error("There shouldn't be a deleted inventory here")
        continue
      }

      if (inventory.bookstoreId === 1) {
        let results = getWasInventoryForThisBook(inventory)
        specifics.push(results)
        total.copias += results.copias
        total.impressionInicial += results.inicial
        total.extraImpressions += results.extraImpressions
        total.entregadosDelAutor += results.entregadosDelAutor
        total.entregadosAlAutor += results.entregadosAlAutor
        total.ventas += results.ventas
        total.disponibles += results.disponibles
        total.thatBookImpressions = results.thatBookImpressions
      } else {
        let results = getOtherInventoryForThisBook(inventory)
        specifics.push(results)
        total.copias += results.copias
        total.ventas += results.ventas
        total.disponibles += results.disponibles
        total.entregadosAlAutor += results.entregadosAlAutor
        total.entregadosDelAutor += results.entregadosDelAutor
      }
    }

    //4. format payload
    const payload = {
      total: total,
      specifics: specifics
    }

    res.status(200).json(payload)

  } catch(error) {
    console.error(error)
    res.status(500).json({message: "server error getting the book inventories"})
  }
}
router.get('/inventoriesByBook/:id', getBookInventory)


export function getWasInventoryForThisBook(inventory) {
   //1. scaffold
   let scaffold = {
    name: inventory.bookstore.name,
    title: inventory.book.title,
    copias: 0,
    inicial: 0,
    extraImpressions: 0,
    returns: 0,
    transfers: 0,
    entregadosDelAutor: 0,
    entregadosAlAutor: 0,
    ventas: 0,
    disponibles: 0,
    bookstoreId: inventory.bookstoreId,
    id: inventory.id,
    thatBookImpressions: [],
    bookId: inventory.bookId,
  }

  //2: impressions
  const impressionsRes = getTotalWasImpressions(inventory) 
  scaffold.inicial += impressionsRes.impressionInicial
  scaffold.extraImpressions += impressionsRes.extraImpressions
  // scaffold.entregadosDelAutor += impressionsRes.entregadosDelAutor

  let thatBookImpressions = []
  for (const impression of inventory.book.impressions) {
    if (impression.authorDelivery) {
      continue
    }
    thatBookImpressions.push(impression)
  }
  scaffold.thatBookImpressions = thatBookImpressions

  //3: sales
  const salesRes = getTotalSales(inventory);
  scaffold.ventas += salesRes;

  //4: transfers
  const transfersRes = getTotalWasTransfers(inventory)
  scaffold.transfers += transfersRes.transfers
  scaffold.entregadosAlAutor += transfersRes.entregadosAlAutor
  scaffold.entregadosDelAutor += transfersRes.entregadosDelAutor
  scaffold.returns += transfersRes.returns

  //5: copias
  scaffold.copias = 
    scaffold.inicial +
    scaffold.extraImpressions +
    scaffold.entregadosDelAutor -
    scaffold.transfers
  
  //6: disponibles
  scaffold.disponibles = 
    scaffold.copias -
    scaffold.ventas +
    scaffold.returns -
    scaffold.entregadosAlAutor

  return scaffold
}

export function getOtherInventoryForThisBook(inventory) {
  //1. scaffold
   let scaffold = {
    name: inventory.bookstore.name,
    title: inventory.book.title,
    copias: 0,
    inicial: 0,
    extraTransfers: 0,
    returns: 0,
    entregadosAlAutor: 0,
    entregadosDelAutor: 0,
    ventas: 0,
    disponibles: 0,
    bookstoreId: inventory.bookstoreId,
    bookId: inventory.bookId,
    id: inventory.id,
    wasRed: inventory.bookstore.wasRed
  }

  //2.transfers
  const transferRes = getNonWasTransfers(inventory)
  console.log("transferRes", transferRes)
  scaffold.inicial += transferRes.transferInicial
  scaffold.extraTransfers += transferRes.extraTransfers
  scaffold.returns += transferRes.returns
  scaffold.entregadosAlAutor += transferRes.transfersToAuthors
  scaffold.entregadosDelAutor += transferRes.returnsFromAuthors

  //3.sales
  const salesRes = getTotalSales(inventory)
  scaffold.ventas += salesRes

  //4.copias
  scaffold.copias = scaffold.inicial + scaffold.extraTransfers

  //5.disponibles
  scaffold.disponibles = 
    scaffold.copias - 
    scaffold.returns -
    scaffold.ventas -
    scaffold.entregadosAlAutor +
    scaffold.entregadosDelAutor
  
  if (scaffold.disponibles < 0) {
    console.error("Number of available book is below zero for this bookstore inventories")
    // return
  }

  return scaffold
}

export default router;