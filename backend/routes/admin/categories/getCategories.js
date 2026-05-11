import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getCategories(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const categories = await prismaClient.category.findMany({where: {isDeleted: false}});
    res.status(201).json(categories);
  } catch(error) {
    console.error("Error in the get categories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching categories'});
  }
}
router.get('/categories', getCategories);

export default router;