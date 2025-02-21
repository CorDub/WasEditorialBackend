import { Role } from "@prisma/client";
import { prisma } from "./../server.js"
import express from "express";

const router = express.Router();

router.get('/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.admin, Role.superadmin] }
      },
      select: {
        first_name: true,
        last_name: true,
        country: true,
      },
      orderBy: [
        {last_name: 'asc'},
        {first_name: 'asc'}
      ]
    });
    res.json(admins);
  } catch (error) {
    console.error(error);
  }
});

export default router;
