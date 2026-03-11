import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function updateCategory(req, res) {
  try {
    let inputs = {
      id: parseInt(req.params.id),
      number: parseInt(req.body.number),
      categoryType: req.body.type,
    }
    validateInputs(inputs);

    if (inputs.categoryType === "comissions") {
      inputs.gestionTiendas = parseFloat(req.body.gestionTiendas);
      inputs.gestionMinima = parseFloat(req.body.gestionMinima);
    } else if (inputs.categoryType === "regalias") {
      inputs.regaliasPercent = parseFloat(req.body.regalias);
      inputs.rebate = parseFloat(req.body.rebate);
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const previousCategory = await tx.category.findUnique({
        where: {id: inputs.id}
      });

      if (previousCategory.isDeleted) {
        throw new Error("this category is deleted")
      }

      let updatedCategory;
      if (inputs.categoryType === "comissions") {
        updatedCategory = await tx.category.update({
          where: {
            id: previousCategory.id
          },
          data: {
            number: inputs.number,
            // category_type: inputs.categoryType,
            percentage_management_stores: inputs.gestionTiendas,
            rebate_author: null,
            management_min: inputs.gestionMinima,
            percentage_royalties: null,
            isDeleted: false
          }
        })
      } else if (inputs.categoryType === "regalias") {
        updatedCategory = await tx.category.update({
          where: {
            id: previousCategory.id
          },
          data: {
            number: inputs.number,
            // category_type: inputs.categoryType,
            management_min: null,
            percentage_royalties: inputs.regaliasPercent,
            percentage_management_stores: null,
            rebate_author: inputs.rebate,
            isDeleted: false
          }
        })
      }
    })

    res.status(200).json("Successfully updated the category")
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`type`)"))) {
      res.status(500).json({message: "Uniqueness error - tipo"})
      return;
    }

    console.error("Server error at the update category route:", error);
    res.status(500).json({error: error})
  }
}
router.patch('/category/:id', updateCategory);

export default router;