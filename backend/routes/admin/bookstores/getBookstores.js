import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getBookstores(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const bookstores = await prismaClient.bookstore.findMany({where: {isDeleted: false}});
    res.status(200).json(bookstores);
  } catch(error) {
    console.error("Error in the get bookstores route:", error);
    res.status(500).json({error: 'A server error occurred while fetching bookstores'});
  }
}
router.get('/bookstore', getBookstores);

export default router