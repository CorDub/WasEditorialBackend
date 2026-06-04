import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../../prisma/client.js"

const router = express.Router();

export async function changePassword(req, res) {
  try {
    const password = req.body.password;
    // const id = req.body.user_id;
    const token = req.body.token;
    // const user_id = req.session.user_id;

    let errors = [];

    let upper = 0;
    let lower = 0;
    let number = 0;
    let special = 0;

    const prismaClient = req.prisma || prisma

    // for (const char of password) {
    //   if (/[A-Z]/.test(char)) {
    //     upper += 1
    //   };

    //   if (/[a-z]/.test(char)) {
    //     lower += 1
    //   }

    //   if (/[0-9]/.test(char)) {
    //     number += 1
    //   }

    //   if (/[!@#$%^&*(),.?":{}|<>]/.test(char)) {
    //     special += 1
    //   }
    // }

    // if (upper < 1 || lower < 1 || number <1 || special < 1) {
    //   errors.push(13)
    // }

    if (password.length < 8) {
      errors.push(12)
    };

    if (!token) {
      return res.status(400).json({error: "Token required"});
    }

    const current_user = await prismaClient.user.findUnique({
      where: {
        reset_password_token: token
      }
    });

    if (!current_user) {
      return res.status(401).json({error: "Invalid token"});
    }

    if (current_user.reset_password_expires < new Date()) {
      return res.status(401).json({error: "Expired token"});
    }

    if (await bcrypt.compare(password, current_user.password)) {
      errors.push(14);
    }

    if (errors.length > 0) { return res.status(400).json(errors); }

    const update = await prismaClient.user.update({
      where: {id: current_user.id},
      data: {
        password: await bcrypt.hash(password, 10),
        reset_password_token: null,
        reset_password_expires: null
      }
    });

    res.status(200).json({message: "Successfully updated password"});

  } catch(error) {
    console.error("Error at the change_password route:", error);
    res.status(500).json({error: "There was an issue updating the password."});
  }
}
router.patch('/change_password', changePassword);

export default router;