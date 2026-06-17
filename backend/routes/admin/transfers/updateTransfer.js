import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
import { findEarliestDeliveryToAuthor } from "./transferHelpers.js";

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

    let result = null;

    await prismaClient.$transaction(async (tx) => {
      //2. get the previous transfer and inventory From
      const transferToBeEdited = await tx.transfer.findUnique({
        where: {
          id: inputs.id
        },
        include: {
          toInventory: true,
          fromInventory: true
        }
      })

      if (transferToBeEdited.isDeleted) {
        throw new Error("deleted transfer")
      }

      // routing from here
      // return from author path
      if (!transferToBeEdited.fromInventoryId) {
        console.log("return from author")
        result = await editReturnFromAuthor(tx, transferToBeEdited, inputs)
        return
      }

      // send to author
      if (!transferToBeEdited.toInventoryId) {
        console.log("send to author")
        result = await editSendToAuthor(tx, transferToBeEdited, inputs)
        return
      }
      
      // send to library
      if (transferToBeEdited.fromInventory.bookstoreId === 1) {
        console.log("send to library")
        result = await editSendToLibrary(tx, transferToBeEdited, inputs)
        return
      } 

      // return to library
      console.log("return to library")
      result = await editReturnToLibrary(tx, transferToBeEdited, inputs)
    });

    res.status(result.status).json({message: result.message})
  } catch(error) {
    console.error("\n ERROR WHILE UPDATING TRANSFER \n", error);
    res.status(500).json({error: "a server error occurred while updating the transfer"})
  }
}
router.patch('/transfer/:id', updateTransfer)



async function editReturnFromAuthor(tx, transferToBeEdited, inputs) {
  // check quantity is valid
  const inventoryTo = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.toInventoryId
    },
    include:{
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  const diff = transferToBeEdited.quantity - inputs.quantity
  const derived = getInventoryDerived(inventoryTo)
  if ((derived.entregadosDelAutor + diff) > derived.entregadosAlAutor) {
    const res = {
      status: 400,
      message: `No se puede regresar mas libros que han estado entregados al autor`
    }
    return res
  }

  // check date is valid
  if (inputs.dateStrOptional) {
    const earliestDelivery = findEarliestDeliveryToAuthor(inventoryTo)
    if (inputs.dateStrOptional && inputs.dateStrOptional < earliestDelivery) {
      const res = {
        status: 400,
        message: `No se puede poner una devolución del autor antes de la primera entrega al autor del inventario`
      }
      return res
    }

    const validOrder = checkSendReturnOrder(inventoryTo, transferToBeEdited, "to")
    if (!validOrder) {
      const res = {
        status: 400,
        message: `No se puede poner una devolución del autor antes de que haya suficiente entregas al autor`
      }
      return res
    }
  }

  // edit if all correct 
  const editedReturnFromAuthor = await tx.transfer.update({
    where: {
      id: transferToBeEdited.id
    },
    data: {
      quantity: inputs.quantity,
      note: inputs.note ? inputs.note : transferToBeEdited.note,
      dateStr: inputs.dateStrOptional ? inputs.dateStrOptional : transferToBeEdited.dateStr,
    }
  });

  const res = {
    status: 200,
    message: "Devolución del autor editada con exito"
  }
  return res
} 



async function editSendToAuthor(tx, transferToBeEdited, inputs) {
  // check quantity is valid - both from disponibles upstream and entregados downstream
  const inventoryFrom = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.fromInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  // upstream - check enough disponibles
  const diff = transferToBeEdited.quantity - inputs.quantity
  const derived = getInventoryDerived(inventoryFrom)
  if ((derived.disponibles + diff) < 0) {
    const res = {
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario para hacer este cambio.`
    }
    return res
  }

  // downstream - check enough deliveries to author remaining
  if ((derived.entregadosAlAutor - diff) < derived.entregadosDelAutor) {
    const res = {
      status: 400,
      message: `No se puede tener menos entregas al autor que devoluciones del autor.`
    }
    return res
  }

  // check date is valid
  const validOrder = checkDeliveryReturnOrder(inventoryFrom, transferToBeEdited, "from")
  if (!valid) {
    const res = {
      status: 400,
      message: `No se puede poner una entrega del autor después de sus devoluciones.`
    }
    return res
  }


  // if everything is valid edit
  const editedSendToAuthor = await tx.transfer.update({
    where: {
      id: transferToBeEdited.id
    },
    data: {
      quantity: inputs.quantity,
      note: inputs.note ?? transferToBeEdited.note,
      dateStr: inputs.dateStrOptional ?? transferToBeEdited.dateStr,
      place: inputs.place ?? transferToBeEdited.place,
      person: inputs.person ?? transferToBeEdited.person
    }
  });

  const res = {
    status: 200,
    message: "Entrega al autor editada con exito."
  }

  return res
}



async function editSendToLibrary(tx, transferToBeEdited, inputs) {
  // check quantity is valid - both from disponibles upstream and downstream
  const inventoryFrom = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.fromInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      impressions: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  const inventoryTo = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.toInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  // upstream
  const diff = transferToBeEdited.quantity - inputs.quantity
  const derived = getInventoryDerived(inventoryFrom)
  if ((derived.disponibles + diff) < 0) {
    const res = {
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de salida para hacer este cambio.`
    }
    return res
  }

  // downstream
  const derivedTo = getInventoryDerived(inventoryTo)
  if ((derivedTo.disponibles + diff) < 0) {
    const res = {
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de destinación para hacer este cambio.`
    }
    return res
  }

  //date check
  const valid = checkSendReturnOrder(inventoryFrom, transferToBeEdited, "from")
  if (!valid) {
    const res = {
      status: 400,
      message: `No se puede poner un ingreso a librería después de sus devoluciones.`
    }
    return res
  }

  //if everything is valid edit
  const editedSendToAuthor = await tx.transfer.update({
    where: {
      id: transferToBeEdited.id
    },
    data: {
      quantity: inputs.quantity,
      dateStr: inputs.dateStrOptional ?? transferToBeEdited.dateStr,
    }
  });

  const res = {
    status: 200,
    message: "Ingreso a librería editado con exito."
  }

  return res
}



async function editReturnToLibrary(tx, transferToBeEdited, inputs) {
  // check quantity is valid - both from disponibles upstream and downstream
  const inventoryFrom = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.fromInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  const inventoryTo = await tx.inventory.findUnique({
    where: {
      id: transferToBeEdited.toInventoryId
    },
    include: {
      book: true,
      bookstore: true,
      sales: true,
      transfersFrom: {
        orderBy: {
          dateStr: 'asc'
        }
      },
      transfersTo: {
        orderBy: {
          dateStr: 'asc'
        }
      }
    }
  });

  // upstream
  const diff = transferToBeEdited.quantity - inputs.quantity
  const derived = getInventoryDerived(inventoryFrom)
  if ((derived.disponibles + diff) < 0) {
    const res = {
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de salida para hacer este cambio.`
    }
    return res
  }

  // downstream
  const derivedTo = getInventoryDerived(inventoryTo)
  if ((derivedTo.disponibles + diff) < 0) {
    const res = {
      status: 400,
      message: `No se quedan suficiente libros disponibles en el inventario de destinación para hacer este cambio.`
    }
    return res
  }

  //date
  const valid = checkSendReturnOrder(inventoryFrom, transferToBeEdited, "from")
  if (!valid) {
    const res = {
      status: 400,
      message: `No se puede poner una devolución antes de su ingreso a librería.`
    }
    return res
  }

  //if everything is valid edit
  const editedSendToAuthor = await tx.transfer.update({
    where: {
      id: transferToBeEdited.id
    },
    data: {
      quantity: inputs.quantity,
      dateStr: inputs.dateStrOptional ?? transferToBeEdited.dateStr,
    }
  });

  const res = {
    status: 200,
    message: "Devolución a librería editada con exito."
  }

  return res
}

export default router;