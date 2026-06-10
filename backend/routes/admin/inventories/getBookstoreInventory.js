import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { 
  getTotalWasImpressions,
  getTotalSales,
  getTotalWasTransfers,
  getNonWasTransfers
} from "./inventoryHelpers.js";
const router = express.Router();

export async function getBookstoreInventory(req, res) {
  try {
    //1. validate inputs
    const inputs = {
      "id": parseInt(req.params.id),
    }
    validateInputs(inputs);
    const prismaClient = req.prisma || prisma

    //2. branch methods depending if its WAS or another inventory
    let results;
    if (inputs.id === 1) {
      results = await getWasInventories(prismaClient, inputs.id)
    } else {
      results = await getOtherBookstoreInventories(prismaClient, inputs.id)
    }

    res.status(200).json(results)

  } catch(error) {
    console.error(error)
    res.status(500).json({message: "server error getting the bookstore inventories"})
  }
}
router.get('/inventoriesByBookstore/:id', getBookstoreInventory)


export async function getWasInventories(prismaClient, inputsId) {
  //1. db query
  const wasInventories = await prismaClient.inventory.findMany({
    where: {
      bookstoreId: inputsId,
      isDeleted: false
    },
    select: {
      id: true,
      book: {
        select: {
          id: true,
          title: true,
          impressions: {
            orderBy: {
              date: "asc"
            },
            where: {
              isDeleted: false
            },
            select: {
              id: true,
              quantity: true,
              date: true,
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
        }
      },
      transfersFrom: {
        where: {
          isDeleted: false
        },
        select: {
          quantity: true,
          toInventoryId: true,
          id: true
        }
      },
      transfersTo: {
        where: {
          isDeleted: false
        },
        select: {
          id: true,
          quantity: true,
          toInventoryId: true,
          isDeleted: true
        }
      }
    }
  })

  //2. loop
  let total = {
    name: wasInventories[0].bookstore.name,
    copias: 0,
    inicial: 0,
    extraImpressions: 0,
    returns: 0,
    transfers: 0,
    entregadosDelAutor: 0,
    entregadosAlAutor: 0,
    ventas: 0,
    disponibles: 0,
    bookstoreId: wasInventories[0].bookstoreId,
  }
  let specifics = []

  for (const inventory of wasInventories) {
    if (inventory.isDeleted) {
      console.error("There shouldn't be a deleted inventory here")
      continue
    }

    // 2.1: name and id
    let specific = {
      name: "",
      copias: 0,
      inicial: 0,
      extraImpressions: 0,
      returns: 0,
      transfers: 0,
      entregadosDelAutor: 0,
      entregadosAlAutor: 0,
      ventas: 0,
      disponibles: 0,
      id: 0,
      type: "book",
      bookId: 0,
      bookstoreId: 0
    }
    specific.name = inventory.book.title
    specific.bookId = inventory.bookId
    specific.id = inventory.id
    specific.bookstoreId = inventory.bookstoreId

    //2.2: impressions
    const impressionsRes = getTotalWasImpressions(inventory) 
    specific.inicial += impressionsRes.impressionInicial
    specific.extraImpressions += impressionsRes.extraImpressions
    specific.entregadosDelAutor += impressionsRes.entregadosDelAutor
    total.inicial += impressionsRes.impressionInicial
    total.extraImpressions += impressionsRes.extraImpressions
    total.entregadosDelAutor += impressionsRes.entregadosDelAutor

    //2.3: sales
    const salesRes = getTotalSales(inventory);
    specific.ventas += salesRes;
    total.ventas += salesRes;

    //2.4: transfers
    const transfersRes = getTotalWasTransfers(inventory)
    total.transfers += transfersRes.transfers
    total.entregadosAlAutor += transfersRes.entregadosAlAutor
    total.returns += transfersRes.returns
    total.entregadosDelAutor += transfersRes.entregadosDelAutor
    specific.transfers += transfersRes.transfers
    specific.entregadosAlAutor += transfersRes.entregadosAlAutor
    specific.returns += transfersRes.returns
    specific.entregadosDelAutor += transfersRes.entregadosDelAutor

    //2.5: copias
    specific.copias = 
      specific.inicial +
      specific.extraImpressions +
      specific.entregadosDelAutor -
      specific.transfers
    total.copias += specific.copias
    
    //2.6: disponibles
    specific.disponibles = 
      specific.copias -
      specific.ventas +
      specific.returns -
      specific.entregadosAlAutor
    total.disponibles += specific.disponibles

    //2.7: push
    specifics.push(specific)
  }

  //3. format return
  const payload = {
    total: total,
    specifics: specifics
  }

  return payload
}

export async function getOtherBookstoreInventories(prismaClient, inputsId) {
  //1. db query
  const thatBookstoreInventories = await prismaClient.inventory.findMany({
    where: {
      bookstoreId: inputsId,
      isDeleted: false
    },
    select: {
      id: true,
      book: {
        select: {
          id: true,
          title: true,
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
        }
      },
      transfersFrom: {
        where: {
          isDeleted: false
        },
        select: {
          quantity: true,
          toInventoryId: true,
          id: true,
          isDeleted: true
        }
      },
      transfersTo: {
        where: {
          isDeleted: false
        },
        orderBy: {
          deliveryDate: "asc"
        },
        select: {
          id: true,
          quantity: true,
          toInventoryId: true,
          fromInventoryId: true,
          isDeleted: true
        }
      }
    }
  })

  //2: loop
  let total = {
    name: thatBookstoreInventories[0].bookstore.name,
    copias: 0,
    inicial: 0,
    extraTransfers: 0,
    returns: 0,
    entregadosAlAutor: 0,
    entregadosDelAutor: 0,
    ventas: 0,
    disponibles: 0,
    bookstoreId: thatBookstoreInventories[0].bookstoreId
  }
  let specifics = []

  for (const inventory of thatBookstoreInventories) {
    if (inventory.isDeleted) {
      console.error("There shouldn't be a deleted inventory here")
      continue
    }

    // 2.1: name and id
    let specific = {
      name: "",
      copias: 0,
      inicial: 0,
      extraTransfers: 0,
      returns: 0,
      entregadosAlAutor: 0,
      entregadosDelAutor: 0,
      ventas: 0,
      disponibles: 0,
      id: 0,
      type: "book",
      bookId: 0,
      bookstoreId: 0,
    }
    specific.name = inventory.book.title
    specific.bookId = inventory.bookId
    specific.id = inventory.id
    specific.bookstoreId = inventory.bookstoreId

    //2.3: sales
    const salesRes = getTotalSales(inventory);
    specific.ventas += salesRes;
    total.ventas += salesRes;

    //2.4: transfers
    const transferRes = getNonWasTransfers(inventory);
    specific.inicial += transferRes.transferInicial
    specific.extraTransfers += transferRes.extraTransfers
    specific.returns += transferRes.returns
    specific.entregadosAlAutor += transferRes.transfersToAuthors
    specific.entregadosDelAutor += transferRes.returnsFromAuthors
    total.inicial += transferRes.transferInicial
    total.extraTransfers += transferRes.extraTransfers
    total.returns += transferRes.returns
    total.entregadosAlAutor += transferRes.transfersToAuthors
    total.entregadosDelAutor += transferRes.returnsFromAuthors

    //2.5: copias
    specific.copias = specific.inicial + specific.extraTransfers
    total.copias += specific.copias
    
    //2.6: disponibles
    specific.disponibles = 
      specific.copias -
      specific.ventas -
      specific.returns -
      specific.entregadosAlAutor +
      specific.entregadosDelAutor
    total.disponibles += specific.disponibles

    //2.7: push
    specifics.push(specific)
  }

  //3: format payload
  const res = {
    total: total,
    specifics: specifics
  }

  return res
}

export default router