import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getImpactedBooks(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const category = await prismaClient.category.findUnique({
      where: {
        id: inputs.id
      },
      select: {
        books: true
      }
    })

    res.status(200).json({numImpactedUsers: category.books.length})
  } catch (error) {
    console.error("Error in the get Impacted Users route:", error);
    res.status(500).json({error: "A server error occurred while fetching number of impacted users"})
  }
}
router.get('/categoryImpactedBooks/:id', getImpactedBooks)

export default router;