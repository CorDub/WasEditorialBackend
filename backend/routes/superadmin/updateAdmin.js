import express from "express";
import { prisma } from "../../prisma/client.js";
import { validateInputs } from "../../utils.js";
const router = express.Router();

export async function updateAdmin(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const inputs = {
      "id": parseInt(req.params.id),
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "email": req.body.email,
      "role": req.body.role
    }
    validateInputs(inputs);


    const admin = await prismaClient.user.findUnique({
      where: {
        id: inputs.id
      }
    })

    if (admin && admin.isDeleted) {
      throw new Error("User has been deleted")
    };
    
    const updatedAdmin = await prismaClient.user.update({
      where: {id: admin.id},
      data: {
        first_name: inputs.firstName,
        last_name: inputs.lastName,
        email: inputs.email,
        role: inputs.role
      }
    });

    if (updatedAdmin) {
      res.status(200).json({message: "Successfully updated user"});
    } else {
      res.status(500).json({error: "There was an issue updating the author"});
    };

  } catch(error) {
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
}
router.patch('/api/admin/:id', updateAdmin);

export default router;