import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
const router = express.Router();

export async function deleteCategory(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "categoryId": parseInt(req.body.selectedCategory)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      if (inputs.categoryId !== 0) {
        const impactedBooks = await tx.book.findMany({
          where: {
            categoryId: inputs.id
          }
        });

        for (const book of impactedBooks) {
          await tx.book.update({where: {id: book.id}, data: {categoryId: inputs.categoryId}})
        }
      }

      const deletedCategory = await tx.category.update({
        where: {id: inputs.id},
        data: {isDeleted: true}
      });
    })

    res.status(200).json({message: "La categoria ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the category'});
  }
}
router.delete('/category/:id', deleteCategory)

export default router;