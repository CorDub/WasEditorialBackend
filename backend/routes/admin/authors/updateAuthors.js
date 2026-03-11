import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function updateAuthor(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "firstName": req.body.first_name,
      "lastName": req.body.last_name,
      "referido": req.body.referido,
      "email": req.body.email,
      "phone": req.body.phone,
      "phonePrefix": req.body.phonePrefix,
      "birthday": req.body.birthday,
    }
    validateInputs(inputs);
    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      const updatedAuthor = await tx.user.update({
        where: {id: inputs.id},
        data: {
          first_name: inputs.firstName,
          last_name: inputs.lastName,
          referido: inputs.referido,
          email: inputs.email,
          phone: inputs.phone,
          phonePrefix: inputs.phonePrefix,
          birthday: inputs.birthday,
        }
      });

      if (updatedAuthor) {
        res.status(200).json({message: "Successfully updated user"});
      } else {
        res.status(500).json({error: "There was an issue updating the author"});
      };
    })

  } catch(error) {
    console.error("Server error at the update user route:", error);
    res.status(500).json({error: "There was an issue updating the author"});
  }
}
router.patch('/user/:id', updateAuthor);

export default router;