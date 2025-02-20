import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

router.patch('/change_password', async (req, res) => {
  try {
    const { user_id, password } = req.body;
    let errors = [];

    let upper = 0;
    let lower = 0;
    let number = 0;
    let special = 0;

    for (const char of password) {
      if (/[A-Z]/.test(char)) {
        upper += 1
      };

      if (/[a-z]/.test(char)) {
        lower += 1
      }

      if (/[0-9]/.test(char)) {
        number += 1
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(char)) {
        special += 1
      }
    }

    if (upper < 1 || lower < 1 || number <1 || special < 1) {
      // res.status(400).json({message: "Password not meeting composition requirements"});
      // return;
      errors.push(13)
    }

    if (password.length < 8) {
      // res.status(400).json({message: "Password not meeting length requirements"});
      // return;
      errors.push(12)
    };

    const current_user = await prisma.user.findUnique({where: {id: user_id}});
    if (await bcrypt.compare(password, current_user.password)) {
      // res.status(400).json({message: "Password is the same as previous one"});
      // return;
      errors.push(14);
    }

    if (errors.length > 0) {
      res.status(400).json(errors);
      return;
    }

    const update = await prisma.user.update({
      where: {id: user_id},
      data: {password: await bcrypt.hash(password, 10)}
    });

    if (update) {
      res.status(200).json({message: "Successfully updated password"});
    } else {
      res.status(500).json({error: "There was an issue updating the password."});
    }

  } catch(error) {
    console.error("Error at the change_password route:", error);
  }
})

export default router;
