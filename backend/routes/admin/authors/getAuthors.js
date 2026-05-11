import express from "express";
import { prisma } from "../../../prisma/client.js";

const router = express.Router();


export async function getAuthors(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const users = await prismaClient.user.findMany({
      where: {
        role: "author",
        isDeleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        referido: true,
        email: true,
        phone: true,
        phonePrefix: true,
        birthday: true,
        clabe: true,
        name_bank_account: true,
        bank: true,
        swift: true,
      },
      orderBy: [
        {first_name: 'asc'},
        {last_name: 'asc'}
      ]
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at users route"});
  }
}
router.get('/users', getAuthors);

export default router;