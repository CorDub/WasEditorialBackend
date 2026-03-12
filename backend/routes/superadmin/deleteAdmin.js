import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function deleteAdmin(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const inputs = {
      "id": parseInt(req.params.id)
    }
    validateInputs(inputs);

    const deletedAdmin = await prismaClient.user.update({where:
      {id: inputs.id},
      data: {
        isDeleted: true,
      }
    });
    res.status(200).json({message: "El admin ha sido eliminado con exito."})
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the admin'});
  }
}
router.delete('/api/admin/:id', deleteAdmin);

export default router;