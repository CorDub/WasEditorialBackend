import express from "express";
import { prisma } from "../../../prisma/client.js";
import { 
  validateInputs,
} from "../../../utils.js";
const router = express.Router();


export async function getCurrentCosts(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const currentCosts = await prismaClient.cost.findMany({
      where: {
        isDeleted: false,
        payment: {
          // status: "created",
          isDeleted: false
        }
      },
      select: {
        id: true,
        paymentId: true,
        note: true,
        amount: true,
        dateStr: true,
        payment: {
          select: {
            forMonth: true,
            status: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        book: {
          select: {
            title: true
          }
        },
        bookId: true
      }
    })

    if (currentCosts) {
      res.status(200).json(currentCosts);
    }
  } catch(error) {
    console.error("\n ERROR getting current costs from server \n", error);
    res.status(500).json({error:"a server error occurred while fetching payments"})
  }
}
router.get('/currentCosts', getCurrentCosts)

export default router;