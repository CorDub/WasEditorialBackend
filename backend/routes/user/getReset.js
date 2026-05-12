import express from "express";
import { prisma } from "../../prisma/client.js";
import { validateInputs } from "../../utils.js";
import { sendResetPasswordMail } from "../../mailer.js";
const router = express.Router();

export async function getReset(req, res) {
  try {
    const inputs = {
      email: req.body.email
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    const user = await prismaClient.user.findUnique({where: {email: inputs.email,}});
    if (user && user.isDeleted) {
      return res.status(204).json("Error retrieving the user");
    }
    if (!user) {
      return res.status(204).json("Error retrieving the user");
    }

    await sendResetPasswordMail(inputs.email, user.first_name)
    const user_send = {
      id: user.id,
    }
    res.status(200).json(user_send);
  } catch (error) {
    console.error("Error retrieving the user:", error)
    return res.status(500).json("Error retrieving the user");
  }
}
router.post('/reset', getReset)

export default router;