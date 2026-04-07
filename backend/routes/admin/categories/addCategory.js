import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js"; 
const router = express.Router();

export async function addCategory(req, res) {
  try {
    let inputs = {
      number: parseInt(req.body.number),
      categoryType: req.body.type,
    }
    validateInputs(inputs);

    if (inputs.categoryType === "comissions") {
      inputs.gestionMinima = parseFloat(req.body.gestionMinima);
      inputs.gestionTiendas = parseFloat(req.body.gestionTiendas);
    } else if (inputs.categoryType === "regalias") {
      inputs.regaliasPercent = parseFloat(req.body.regalias);
      inputs.rebate = parseFloat(req.body.rebate);
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: {
          number: inputs.number
        }
      });

      if (existing) {
        if (existing.isDeleted === false) {
          console.error("This category already exists")
          res.status(500).json({message: "Esta categoria ya existe"})
          return;
        }

        // const exhumedUser = await tx.user.update({
        //   where: {id: existing.id},
        //   data: {
        //     type: inputs.categoryType,
        //     // percentage_royalties: parseFloat(regalias),
        //     // percentage_management_stores: parseFloat(gestionTiendas),
        //     management_min: inputs.gestionMinima,
        //     isDeleted: false
        //   }
        // });
        // res.status(201).json({name: exhumedUser.type});

        let exhumedCategory;
        if (inputs.categoryType === "comissions") {
          exhumedCategory = await tx.category.update({
            where: {
              id: existing.id
            },
            data: {
              number: inputs.number,
              category_type: inputs.categoryType,
              percentage_management_stores: inputs.gestionTiendas,
              management_min: inputs.gestionMinima,
              isDeleted: false
            }
          })
        } else if (inputs.categoryType === "regalias") {
          exhumedCategory = await tx.category.update({
            where: {
              id: existing.id
            },
            data: {
              number: inputs.number,
              category_type: inputs.categoryType,
              rebate_author: inputs.rebate,
              percentage_royalties: inputs.regaliasPercent,
              isDeleted: false
            }
          })
        }

        res.status(201).json({name: exhumedCategory.number})
        return;
      }

      let new_category;
      if (inputs.categoryType === "comissions") {
        new_category =  await tx.category.create({
          data: {
            number: inputs.number,
            category_type: inputs.categoryType,
            percentage_management_stores: inputs.gestionTiendas,
            management_min: inputs.gestionMinima,
          },
        });
      } else if (inputs.categoryType === "regalias") {
        new_category =  await tx.category.create({
          data: {
            number: inputs.number,
            category_type: inputs.categoryType,
            percentage_royalties: inputs.regaliasPercent,
            rebate_author: inputs.rebate,
          },
        });
      }

      res.status(201).json({name: new_category.number});
    })
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`number`)"))) {
      console.error(error)
      res.status(500).json({message: "Uniqueness error - number"})
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
}
router.post('/category', addCategory);

export default router;