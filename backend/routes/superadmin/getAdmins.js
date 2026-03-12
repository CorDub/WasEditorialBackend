import express from "express";
import { prisma } from "../../prisma/client.js";
import { Role } from "@prisma/client";
const router = express.Router();

export async function getAdmins(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const admins = await prismaClient.user.findMany({
      where: {
        role: { in: [Role.admin, Role.superadmin] },
        isDeleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      },
      orderBy: [
        {last_name: 'asc'},
        {first_name: 'asc'}
      ]
    });

    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
  }
}
router.get('/admins', getAdmins);

export default router;