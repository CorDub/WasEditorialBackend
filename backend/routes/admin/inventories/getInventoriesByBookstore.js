import express from "express";
import { prisma } from "../../../prisma/client.js";
import {
  getTotalWasImpressions,
  getTotalWasTransfers,
  getTotalSales
} from "./inventoryHelpers.js"
const router = express.Router();

export async function getInventoriesByBookstore(req, res) {
  try {
    const prismaClient = req.prisma || prisma

    // step 1 : get data
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
            name: true,
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
        transfersTo: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            deliveryDate: "asc"
          },
          select: {
            id: true,
            quantity: true,
            toInventoryId: true,
            isDeleted: true
          }
        }
      }
    });

    //step 2: Triage that data
    const triaged = separateInventories(inventories)

    //step 3: Treat WAS inventories
    const wasTotal = handleWasInventories(triaged.was)

    //step 4: Other inventories loop
    const otherInventories = handleOtherInventories(triaged.other)

    //step 5: format and send payload
    let result = [wasTotal, ...otherInventories];
    
    res.status(200).json(result);

  } catch(error) {
    console.error(error);
    res.status(500).json({error: "Server error fetching inventories route"});
  }
}
router.get("/inventoriesByBookstore", getInventoriesByBookstore);


export function separateInventories(inventories) {
  let inventoriesWas = []
  let otherInventories = []

  for (const inventory of inventories) {
    if (inventory.bookstoreId === 1) {
      inventoriesWas.push(inventory)
    } else {
      otherInventories.push(inventory)
    }
  }

  const res = {
    was: inventoriesWas,
    other: otherInventories
  }

  return res
}


export function handleWasInventories(wasInventories) {
  let wasTotal = {
    name: "WAS Editorial",
    copias: 0,
    impressionInicial: 0,
    extraImpressions: 0,
    returns: 0,
    transfers: 0,
    entregadosDelAutor: 0,
    entregadosAlAutor: 0,
    ventas: 0,
    disponibles: 0,
    type: "bookstore",
    id: 1
  }

  for (const inventory of wasInventories) {
    if (inventory.isDeleted) {
      console.error("There shouldn't be a deleted inventory here")
      continue
    }

    // step 1: impressions
    const impressionsRes = getTotalWasImpressions(inventory) 
    wasTotal.impressionInicial += impressionsRes.impressionInicial
    wasTotal.extraImpressions += impressionsRes.extraImpressions
    wasTotal.entregadosDelAutor += impressionsRes.entregadosDelAutor

    //step 2: sales
    wasTotal.ventas += getTotalSales(inventory)
    
    //step 3: transfers
    const transfersRes = getTotalWasTransfers(inventory)
    wasTotal.transfers += transfersRes.transfers
    wasTotal.entregadosAlAutor += transfersRes.entregadosAlAutor
    wasTotal.returns += transfersRes.returns

    //step 4: copias
    wasTotal.copias = 
      wasTotal.impressionInicial +
      wasTotal.extraImpressions +
      wasTotal.entregadosDelAutor -
      wasTotal.transfers

    //step5: disponible
    wasTotal.disponibles = 
      wasTotal.copias -
      wasTotal.ventas +
      wasTotal.returns -
      wasTotal.entregadosAlAutor
    
    if (wasTotal.disponibles < 0) {
      console.error("Available books below zero in this inventory")
    }
  }

  return wasTotal
}

export function handleOtherInventories(inventories) {
  // step 1: group by bookstores 
  let groupedByBookstores = new Map()

  for (const inventory of inventories) {
    if (!groupedByBookstores.has(inventory.bookstoreId)) {
      groupedByBookstores.set(inventory.bookstoreId, [inventory])
    } else {
      const targetInventory = groupedByBookstores.get(inventory.bookstoreId)
      targetInventory.push(inventory)
    }
  }

  // step 2: start the loop
  let res = []
  for (const group of groupedByBookstores.values()) {
    let groupTotal = {
      name: "",
      copias: 0,
      transferInicial: 0,
      extraTransfers: 0,
      returns: 0,
      ventas: 0,
      disponibles: 0,
      type: "bookstore",
      entregadosAlAutor: 0,
      id: 0
    }

    // 2.0: name
    groupTotal.name = group[0].bookstore.name
    groupTotal.id = group[0].bookstoreId

    // step 2.1: transfers
    const transfersRes = transfersOthers(group)
    groupTotal.transferInicial += transfersRes.transferInicial
    groupTotal.extraTransfers += transfersRes.extraTransfers
    groupTotal.returns += transfersRes.returns
    

    //step 2.3: sales
    for (const inventory of group) {
      groupTotal.ventas += getTotalSales(inventory)
    }

    // step 2.4: copias
    groupTotal.copias = groupTotal.transferInicial + groupTotal.extraTransfers

    //step 2.5: disponibles
    groupTotal.disponibles = 
      groupTotal.copias - 
      groupTotal.returns -
      groupTotal.ventas
    
    if (groupTotal.disponibles < 0) {
      console.error("Number of available book is below zero for this bookstore inventories")
      // return
    }

    //2.6 append
    res.push(groupTotal)
  }

  return res
}


export function transfersOthers(groupOfInventories) {
  if (!groupOfInventories || groupOfInventories.length === 0) {
    console.error("Missing or empty group of inventories here")
    return
  }

  // step 2.1: transfers
  let inicialTransfersTo = []
  let extraTransfersTo = []
  let allTransfersFrom = []
  
  //step 2.1.2: sort ascending the transfersTo
  for (const inventory of groupOfInventories) {
    if (inventory.isDeleted) {
      console.error("Deleted inventory here")
      continue
    }

    if (inventory.transfersTo.length === 0) {
      console.error(`TransfersTo is empty for this inventory. This inventory would need an initial transfer. Inventory ID: ${inventory.id}`)
      continue
    }

    let allTransfersTo = inventory.transfersTo
    allTransfersTo.sort((a, b) => a.deliveryDate - b.deliveryDate)

    let inicialTransferAssigned = false
    for (let i = 0; i < allTransfersTo.length; i++) {
      if (allTransfersTo[i].isDeleted) {
        console.error("Shouldn't be a deleted transfer to here")
        continue
      }

      if (!inicialTransferAssigned) {
        inicialTransfersTo.push(allTransfersTo[i])
        inicialTransferAssigned = true
      } else {
        extraTransfersTo.push(allTransfersTo[i])
      }
    }

    if (inventory.transfersFrom.length > 0) {
      for (const transfer of inventory.transfersFrom) {
        if (transfer.isDeleted) {
          console.error("Deleted transfer here")
          continue
        }

        allTransfersFrom.push(transfer)
      }
    }
  }
  
  let res = {
    transferInicial: 0,
    extraTransfers: 0,
    returns: 0
  }

  //2.1.3: get transferInicial and extraTransfers
  for (const transfer of inicialTransfersTo) {
    res.transferInicial += transfer.quantity
  }

  for (const transfer of extraTransfersTo) {
    res.extraTransfers += transfer.quantity
  }

  //2.1.4: get returns
  for (const transfer of allTransfersFrom) {
    if (transfer.toInventoryId === null) {
      console.error(`A non-WAS inventory had a delivery to author transfer. Transfer: ${transfer}`)
      return
    }

    if (transfer.isDeleted) {
      console.error(`A deleted transfer was being processed. Transfer id: ${transfer.id}`)
      return
    }

    res.returns += transfer.quantity
  }

  return res
}

export default router;