import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  twelveMonthsAgo,
  validateInputs,
} from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
const router = express.Router();

export async function deleteTransfer(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    let result;

    await prismaClient.$transaction(async (tx) => {
      const transferToBeDeleted = await tx.transfer.findUnique({
        where: {
          id: inputs.id
        },
        include: {
          toInventory: true,
          fromInventory: true
        }
      })

      if (transferToBeDeleted.isDeleted) {
        throw new Error("deleted transfer")
      }
      
      // routing from here
      // return from author path
      if (!transferToBeDeleted.fromInventoryId) {
        console.log("return from author")
        result = await deleteReturnFromAuthor(tx, transferToBeDeleted)
        return
      }

      // send to author
      if (!transferToBeDeleted.toInventoryId) {
        console.log("send to author")
        result = await deleteSendToAuthor(tx, transferToBeDeleted)
        return
      }
      
      // send to library
      if (transferToBeDeleted.fromInventory.bookstoreId === 1) {
        console.log("send to library")
        result = await deleteSendToLibrary(tx, transferToBeDeleted)
        return
      } 

      // return to library
      console.log("return to library")
      result = await deleteReturnToLibrary(tx, transferToBeDeleted)
    });

    res.status(result.status).json({message: result.message})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the sale'});
  }
}
router.delete('/transfer/:id', deleteTransfer)



async function deleteReturnFromAuthor(tx, transferToBeDeleted) {
  const deletedReturnFromAuthor = await tx.transfer.update({
    where: {
      id: transferToBeDeleted.id
    },
    data: {
      isDeleted: true
    }
  })

  const res = {
    status: 200,
    message: "Movimiento eliminado con exito."
  }
  return res
}



async function deleteSendToLibrary(tx, transferToBeDeleted) {
  // check if there are any returns or delivery to author from the inventory being sent to
  const inventoryTo = await tx.inventory.findUnique({
    where: {
      id: transferToBeDeleted.toInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: true,
      transfersTo: true
    }
  })
  
  const derived = getInventoryDerived(inventoryTo)
  if (derived.disponibles < transferToBeDeleted.quantity) {
    const res = {
      status: 400,
      message: `No quedan suficiente libros en este inventario (${derived.disponibles}) para poder eliminar este ingreso (${transferToBeDeleted.quantity})`
    }
    return res
  }

  // if not delete
  const deletedSendToLibrary = await tx.transfer.update({
    where: {
      id: transferToBeDeleted.id
    },
    data: {
      isDeleted: true
    }
  })

  const res = {
    status: 200,
    message: "Movimiento eliminado con exito."
  }
  return res
}



async function deleteReturnToLibrary(tx, transferToBeDeleted) {
  // can delete straight away if it's a return
  const deletedReturn = await tx.transfer.update({
    where: {
      id: transferToBeDeleted.id
    },
    data: {
      isDeleted: true
    }
  })

  const res = {
    status: 200,
    message: "Movimiento eliminado con exito."
  }

  return res
}



async function deleteSendToAuthor(tx, transferToBeDeleted) {
  // check if there's more or equal sent to author left than returned
  const inventoryFrom = await tx.inventory.findUnique({
    where: {
      id: transferToBeDeleted.fromInventoryId
    }, 
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: true,
      transfersTo: true
    }
  })

  const derived = getInventoryDerived(inventoryFrom)
  if ((derived.entregadosDelAutor + transferToBeDeleted.quantity) > derived.entregadosAlAutor) {
    const res = {
      status: 400,
      message: `Quedan devoluciones de autor vinculadas a esta entrega al autor. Por favor elimine las devoluciones primero.`
    }
    return res
  }

  //if all good go ahead and delete
  const deletedTransfer = await tx.transfer.update({
    where: {
      id: transferToBeDeleted.id
    },
    data: {
      isDeleted: true
    }
  })

  const res = {
    status: 200,
    message: "Movimiento eliminado con exito."
  }

  return res
}



export default router;