import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();


export async function deleteAuthor(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    };
    validateInputs(inputs);
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      const deletedAuthor = await tx.user.update({
        where: {id: inputs.id},
        data: {isDeleted: true}
      });

      if (deletedAuthor) {
        const deletedBooksIds = await softDeleteBooksOnCascade(deletedAuthor, tx);
        for (const bookId of deletedBooksIds) {
          await Promise.all([
            softDeleteImpressionsOnCascade(bookId, tx),
            softDeleteKindleSalesOnCascade(bookId, tx),
            softDeleteCostsOnCascade(bookId, tx),
          ]);
        }
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade(deletedBooksIds, "books", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        const deletedPayments = await softDeletePaymentsOnCascade(deletedAuthor, tx);
      };
    })

    res.status(200).json({message: "El autor ha sido eliminado (recuperable) con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the user'});
  }
}
router.delete('/user/:id', deleteAuthor);

export default router