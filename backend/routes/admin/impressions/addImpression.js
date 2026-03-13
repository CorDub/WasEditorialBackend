import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
const router = express.Router();


export async function addImpression(req, res) {
  try {
    const inputs = {
      quantity: parseInt(req.body.quantity),
      id: parseInt(req.body.id),
      note: req.body.note,
      dateStr: req.body.dateStr,
      authorDelivery: req.body.authorDelivery ? true : false
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const createdImpression = await tx.impression.create({
        data: {
          bookId: inputs.id,
          quantity: inputs.quantity,
          note: inputs.note,
          dateStr: inputs.dateStr,
          authorDelivery: inputs.authorDelivery
        }
      })

      // const wasInventory = await tx.inventory.findUnique({
      //   where: {
      //     bookId_bookstoreId: {
      //       bookId: inputs.id,
      //       bookstoreId: 1,
      //     }
      //   }
      // });

      // if (!wasInventory) {
      //   res.status(400).json({message: "Este libro no existe en la bodega Was"})
      //   return;
      // }

      // if (!wasInventory.isDeleted) {
      //   const updatedInventory = await tx.inventory.update({
      //     where: {id: wasInventory.id},
      //     data: {
      //       current: wasInventory.current + inputs.quantity,
      //       // initial: wasInventory.initial + quantity
      //     }
      //   })
      // };
      res.status(201).json(createdImpression);
    })

  } catch (error) {
    console.error("\n ERROR CREATING THE IMPRESSION: \n", error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.post('/impression', addImpression)

export default router;