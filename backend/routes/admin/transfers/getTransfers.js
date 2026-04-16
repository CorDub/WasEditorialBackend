import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getTransfers(req, res) {
  try {
    const prismaClient = req.prisma || prisma

    const allTransfers = await prismaClient.transfer.findMany({
      where: {
        isDeleted: false
      },
      include: {
        fromInventory: {
          include: {
            book: true,
            bookstore: true
          }
        },
        toInventory: {
          include: {
            bookstore: true
          }
        }
      }
    })

    const allAuthorDeliveries = await prismaClient.impression.findMany({
      where: {
        isDeleted: false,
        authorDelivery: true
      },
      include: {
        book: true
      }
    })

    const combined = [...allTransfers, ...allAuthorDeliveries].sort((a, b) => {
      if (a.dateStr !== b.dateStr) {
        return b.dateStr > a.dateStr ? 1 : -1;
      }
      return b.updatedAt > a.updatedAt ? 1 : -1;
    });

    res.status(200).json(combined)
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at users route"});
  }
}
router.get('/transfers', getTransfers);

export default router;