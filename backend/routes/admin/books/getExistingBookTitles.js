import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getExistingBookTitles(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;
    const existingBooks = await prismaClient.book.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        inventories: {
          select: {
            bookstoreId: true
          }
        }
      },
      orderBy: {
        title: "asc"
      }
    });
    res.status(200).json(existingBooks);
  } catch (error) {
    console.error("Error while fetching existingBooks in the backend:", error);
    res.status(500).json({error: "A server error occurred while fetching existingBooks"});
  }
}
router.get('/existingBooks', getExistingBookTitles);

export default router;