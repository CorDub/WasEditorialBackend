import express from "express";
import { prisma } from "../../prisma/client.js";
const router = express.Router();

export async function getConfirmationCode(req, res) {
  try {
    const { confirmation_code, user_id } = req.body;
    if (isNaN(parseInt(confirmation_code)) || confirmation_code.toString().length < 6) {
      return res.status(500).json({error: "A server error occurred while confirming the code"});
    }

    const error = validateInput("id", user_id);
    if (error.length > 0) {
      return res.status(500).json({error: "A server error occurred while confirming the code"});
    }

    const prismaClient = req.prisma || prisma

    const matched = await matchConfirmationCode(confirmation_code, user_id, prismaClient);

    if (matched === true) {
      const user = await prismaClient.user.findUnique({where: {id: user_id}});
      if (user.isDeleted) {
        return res.status(500).json({error: "A server error occurred while confirming the code"});
      }
      req.session.user_id = user.id;
      res.status(200).json({message: "All good"});
    } else {
      res.status(500).json({error: 'A server error ocurred while confirming the code'});
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server error ocurred while confirming the code'});
  }
}
router.post('/confirmation_code', getConfirmationCode)

export default router;