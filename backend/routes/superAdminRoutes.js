import { Role } from "@prisma/client";
import { prisma } from "./../server.js"
import express from "express";
import { createRandomPassword } from "../utils.js";
import bcrypt from "bcrypt";
import { sendSetPasswordMail } from "../mailer.js";

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
    console.log(admins);
    res.json(admins);
  } catch (error) {
    console.error(error);
  }
});

router.post('/admin', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
    } = req.body;
    const password = createRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const new_admin = await prisma.user.create({
      data: {
        fistName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        role: admin
      }
    })

    res.status(201).json({
      firstName: new_admin.first_name,
      lastName: new_admin.last_name,
      email: new_author.email
    });
    sendSetPasswordMail(email, firstName, lastName);

  } catch (error) {
    console.error(error);
    if (String(error).includes(("Unique constraint failed on the fields: (`email`)"))) {
      res.status(500).json({message: "El correo ya está usado"})
      return;
    }

    if (String(error).includes(("Unique constraint failed on the fields: (`first_name`,`last_name`)"))) {
      res.status(500).json({message: "Un autor con el mismo nombre completo ya existe"})
      return;
    }
    res.status(500).json({ error: error });
  }
});

export default router;
