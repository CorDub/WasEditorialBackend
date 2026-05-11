import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { validateInput } from "../../../validations.js";
const router = express.Router();

export async function updateBookPrices(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
    }
    validateInputs(inputs);
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const bookWithPricesToUpdate = await prismaClient.book.findUnique({where: {id: inputs.id}});
    if (bookWithPricesToUpdate.isDeleted) {
      throw new Error (`this book is deleted`);
    }

    const prices = req.body.prices;
    for (const price of prices) {
      const error = validateInput("price", parseFloat(price.price));
      if (error.length > 0) {
        throw new Error (`invalid input ${error[0]}`)
      }
    }

    await prismaClient.$transaction(async (tx) => {
      for (const price of prices) {
        const updatedInventory = await tx.inventory.update({
          where: {id: parseInt(price.inventoryId)},
          data: {price: parseFloat(price.price)},
        })
      }

      res.status(200).json({message: "Successfully updated the book prices"});
    })
  } catch (error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the prices"});
  }
}
router.patch('/book/:id/prices', updateBookPrices);

export default router