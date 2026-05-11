import express from "express";
import { prisma } from "../../prisma/client.js";
const router = express.Router();

export async function getUserExtra(req, res) {
  try {
    const user_id = req.session.user_id;
    if (!user_id) { 
      return res.status(401).json({message: "Unauthorized"})
    }
    const prismaClient = req.prisma || prisma

    const user = await prismaClient.user.findUnique({where: {id: user_id}});
    if (user && user.isDeleted) {
      return res.status(204).json({message: "No user found"})
    }
    if (!user) {
      return res.status(204).json({message: "No user found"});
    }

    const user_send = {
      "email": user.email,
      "phone": user.phone,
      "phonePrefix" : user.phonePrefix,
      "birthday": user.birthday,
      "font_size": user.font_size,
      "clabe": user.clabe,
      "name_bank_account": user.name_bank_account,
      "bank": user.bank,
      "swift": user.swift
    }
    res.status(200).json(user_send);
  } catch (error) {
    console.error("Error retrieving info: ", error)
    return res.status(500).json({message: "Error retrieving info"})
  }
}
router.get('/user_extra', getUserExtra)

export default router;