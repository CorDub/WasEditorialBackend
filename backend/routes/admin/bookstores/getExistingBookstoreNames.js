import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getExistingBookstoreNames(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const existingBookstores = await prismaClient.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        inventories: {
          select: {
            bookId: true
          }
        }
      }
    })
    res.status(200).json(existingBookstores);
  } catch (error) {
    console.error("Error in the route existingBookstores:", error);
    res.status(500).json({error: 'A server error occurred while fetching existingBookstores'});
  }
}
router.get('/existingBookstores', getExistingBookstoreNames);

export default router;