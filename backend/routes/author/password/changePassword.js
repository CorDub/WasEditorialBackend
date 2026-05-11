import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../../../prisma/client.js"

const router = express.Router();

export async function changePassword(req, res) {
  try {
    const password = req.body.password;
    const user_id = req.session.user_id;

    let errors = [];

    let upper = 0;
    let lower = 0;
    let number = 0;
    let special = 0;

    const prismaClient = req.prisma || prisma

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
      errors.push(13)
    }

    if (password.length < 8) {
      errors.push(12)
    };

    const current_user = await prismaClient.user.findUnique({where: {id: user_id}});
    if (await bcrypt.compare(password, current_user.password)) {
      errors.push(14);
    }

    if (errors.length > 0) { return res.status(400).json(errors); }

    const update = await prismaClient.user.update({
      where: {id: user_id},
      data: {password: await bcrypt.hash(password, 10)}
    });

    res.status(200).json({message: "Successfully updated password"});

  } catch(error) {
    console.error("Error at the change_password route:", error);
    res.status(500).json({error: "There was an issue updating the password."});
  }
}
router.patch('/change_password', changePassword);

export default router;