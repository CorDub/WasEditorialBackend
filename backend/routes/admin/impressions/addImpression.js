import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js" 
// import { validateAuthorReturn } from "../../../unused/routes/impressionHelpers.js";
const router = express.Router();


export async function addImpression(req, res) {
  try {
    const inputs = {
      quantity: parseInt(req.body.quantity),
      id: parseInt(req.body.id),
      note: req.body.note,
      dateStr: req.body.dateStr,
      // authorDelivery: req.body.authorDelivery ? true : false
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      // if (inputs.authorDelivery) {
      //   const valid = validateAuthorReturn(tx, inputs.id, inputs.quantity)
      //   if (!valid) {
      //     res.status(400).json({message: "No se puede regresar mas libros que han estados entregados al autor"})
      //     return;
      //   }
      // }

      const createdImpression = await tx.impression.create({
        data: {
          bookId: inputs.id,
          quantity: inputs.quantity,
          note: inputs.note,
          dateStr: inputs.dateStr,
          authorDelivery: inputs.authorDelivery
        }
      })

      res.status(201).json(createdImpression);
    })

  } catch (error) {
    console.error("\n ERROR CREATING THE IMPRESSION: \n", error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.post('/impression', addImpression)

export default router;