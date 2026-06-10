import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
import { getInventoryDerived } from "../inventories/inventoryHelpers.js";
import { validateAuthorReturn } from "../impressions/impressionHelpers.js";

const router = express.Router();

export async function addTransfer(req, res) {
  try {
    const inputs = {
      bookstoreToId: req.body.bookstoreToId ? parseInt(req.body.bookstoreToId) : null,
      bookId: req.body.bookId ? parseInt(req.body.bookId) : null,
      quantity: parseInt(req.body.quantity),
      inventoryFromId: req.body.inventoryFromId ? parseInt(req.body.inventoryFromId) : null,
      type: req.body.type,
      note: req.body.note || null,
      dateStrOptional: req.body.dateStr || null,
      place: req.body.place || null,
      person: req.body.person || null,
      wasRed: req.body.wasRed || null,
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    //1. transaction start, first checks
    await prismaClient.$transaction(async (tx) => {
      // return to author first cause we don't have an InventoryFromId
      if (!inputs.inventoryFromId) {
        await addReturnFromAuthor(tx, inputs, res)
        return
      }

      // any other cases, get the inventory from
      const inventoryFrom = await tx.inventory.findUnique({
        where: {
          id: inputs.inventoryFromId,
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
      });

      if (inventoryFrom.isDeleted) {
        throw new Error("deleted inventory from")
      }

      const derived = getInventoryDerived(inventoryFrom)
      if (derived.disponibles < inputs.quantity) {
        return res.status(400).json({message: `No hay sufficientes libros en el inventario. Libros disponibles: ${derived.disponibles}`})
      }

      //2. route
      if (!inputs.bookstoreToId) {
        await addDeliveryToAuthor(tx, inventoryFrom, inputs, res)
        return
      }

      if (inputs.bookstoreToId === 1) {
        await addReturn(tx, inventoryFrom, inputs, res)
        return
      } else {
        await addDeliveryToBookstore(tx, inventoryFrom, inputs, res)
        return
      }
    })
  } catch (error) {
    console.error("\n ERROR WHILE CREATING TRANSFER \n", error);
    res.status(500).json({error: "a server error occurred while creating the transfer"})
  }
}
router.post('/transfer', addTransfer);



export async function addDeliveryToAuthor(tx, inventoryFrom, inputs, res) {
  if (!inputs.wasRed && inventoryFrom.bookstoreId !== 1) {
    return res.status(400).json({message: "Entregas a autores solo se pueden hacer desde un inventario Was"})
  }

  const newTransferToAuthor = await tx.transfer.create({
    data: {
      fromInventoryId: inputs.inventoryFromId,
      quantity: inputs.quantity,
      note: inputs.note,
      dateStr: inputs.dateStrOptional,
      place: inputs.place,
      person: inputs.person
    }
  });

  res.status(200).json(newTransferToAuthor)
}



export async function addReturnFromAuthor(tx, inputs, res) {
  const valid = await validateAuthorReturn(tx, inputs.bookId, inputs.bookstoreToId, inputs.quantity)
  if (!valid) {
    res.status(400).json({message: "No se puede regresar mas libros que han estados entregados al autor"})
    return;
  }

  const newReturnFromAuthor = await tx.transfer.create({
    data: {
      toInventoryId: valid.id,
      quantity: inputs.quantity,
      type: inputs.type,
      note: inputs.note,
      dateStr: inputs.dateStrOptional,
    }
  })

  res.status(200).json(newReturnFromAuthor)
}



export async function addReturn(tx, inventoryFrom, inputs, res) {
  if (inventoryFrom.bookstoreId === 1) {
    throw new Error("bookstoreId can't be 1 for a return")
  } 

  const inventoryTo = await getInventoryTo(tx, inventoryFrom, inputs)

  const newTransfer = await tx.transfer.create({
    data: {
      fromInventoryId: inputs.inventoryFromId,
      toInventoryId: parseInt(inventoryTo.id),
      quantity: inputs.quantity,
      type: inputs.type,
      dateStr: inputs.dateStrOptional
    }
  });

  res.status(200).json(newTransfer)
}



export async function addDeliveryToBookstore(tx, inventoryFrom, inputs, res) {
  if (inventoryFrom.bookstoreId !== 1) {
    throw new Error("bookstoreId can't be other than 1 for a delivery to other bookstores")
  }

  const inventoryTo = await getInventoryTo(tx, inventoryFrom, inputs)

  const newTransfer = await tx.transfer.create({
    data: {
      fromInventoryId: inputs.inventoryFromId,
      toInventoryId: parseInt(inventoryTo.id),
      quantity: inputs.quantity,
      type: inputs.type,
      dateStr: inputs.dateStrOptional
    }
  });

  res.status(200).json(newTransfer)
}



export async function getInventoryTo(tx, inventoryFrom, inputs) {
  //1. get inventoryTo
  let inventoryTo = await tx.inventory.findUnique({
    where: {
      bookId_bookstoreId: {
        bookId: inventoryFrom.bookId,
        bookstoreId: inputs.bookstoreToId
      },
    }
  });

  //2. if it doesn't exist create it
  if (!inventoryTo) {
    const newInventoryTo = await tx.inventory.create({
      data: {
        bookId: inventoryFrom.bookId,
        bookstoreId: inputs.bookstoreToId,
        price: inventoryFrom.price
      }
    });
    inventoryTo = newInventoryTo
  } 

  //3. if it's deleted recover it
  if (inventoryTo && inventoryTo.isDeleted) {
    const recoveredInventoryTo = await tx.inventory.update({
      where: {id: inventoryTo.id},
      data: {
        isDeleted: false,
        price: inventoryFrom.price
      }
    });
    inventoryTo = recoveredInventoryTo
  }

  return inventoryTo
}

export default router;