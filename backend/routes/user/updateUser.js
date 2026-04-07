import express from "express";
import { prisma } from "../../prisma/client.js";
import { validateInput } from "../../validations.js";
const router = express.Router();

export async function updateUser(req, res) {
  try {
    const fieldToChange = req.body;
    const permittedFields = [
      "email", "phone", "phonePrefix", "birthday", 'clabe', "name_bank_account",
      "bank", "swift"
    ]
    for (const field of Object.entries(fieldToChange)) {
      if (!permittedFields.includes(field[0])) {
        return res.status(500).json({error: "Internal server error" })
      }

      let errors = validateInput(field[0], field[1]);
      // if (field[0] === "font_size") {
      //   errors = validateInput(parseFloat(field[0]), field[1])
      // } else {
      // errors = validateInput(field[0], field[1])
      // }

      if (errors.length > 0) {
        throw new Error (`invalid input ${errors[0]}`)
      }
    }

    const prismaClient = req.prisma || prisma

    const targetUser = await prismaClient.user.findUnique({ where: {id: req.session.user_id}})
    if (!targetUser || targetUser.isDeleted) {
      return res.status(500).json({message: "Updated"})
    }

    const updatedUser = await prismaClient.user.update({
      where: {id: req.session.user_id},
      data: {
        ...fieldToChange
      }
    });

    res.status(200).json({message: "Updated"});

  } catch (error) {
    console.error("Error when updating user: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
router.patch('/user', updateUser)

export default router;