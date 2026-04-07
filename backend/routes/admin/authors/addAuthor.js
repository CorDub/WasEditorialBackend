import express from "express";
import { prisma } from "../../../prisma/client.js";
import { validateInputs } from "../../../utils.js";
import { sendWelcomeMail } from "../../../mailer.js";
const router = express.Router();

export async function addAuthor(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const inputs = {
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "referido": req.body.referido,
      "email": req.body.email,
      "phone": req.body.phone,
      "phonePrefix": req.body.phonePrefix,
      "birthday": req.body.birthday,
    }
    validateInputs(inputs);

    let new_author;
    await prismaClient.$transaction(async (tx) => {
      const existingUsers = await tx.user.findMany({
        where: {
          AND: [{
            first_name: {
              startsWith: inputs.firstName
            },
          },
          {
            last_name: {
              startsWith: inputs.lastName
            }
          }
        ]},
      })

      if (existingUsers.length > 1) {
        const lastDeletedUser =  await tx.user.findUnique({
          where: {
            first_name_last_name: {
              first_name: inputs.firstName,
              last_name: inputs.lastName
            }
          }
        })
        
        if (lastDeletedUser && lastDeletedUser.isDeleted) {
          const updatedLastDeletedUser = await tx.user.update({
          where: {
            first_name_last_name: {
              first_name: inputs.firstName,
              last_name: inputs.lastName
            }
          },
          data: {
            first_name: inputs.firstName + "_deleted" + existingUsers.length,
            last_name: inputs.lastName +"_deleted" + existingUsers.length,
            email: null,
            clabe: null
          }
        })
        }
      }

      if (existingUsers.length === 1 && existingUsers[0].isDeleted) {
        const revivedUser = await tx.user.update({
          where: {
            id: existingUsers[0].id
          },
          data: {
            first_name: existingUsers[0].first_name + "_deleted",
            last_name: existingUsers[0].last_name + "_deleted",
            email: null,
            clabe: null
          }
        })
      } 

      new_author = await tx.user.create({
        data: {
          first_name: inputs.firstName,
          last_name: inputs.lastName,
          referido: inputs.referido,
          email: inputs.email,
          phone: inputs.phone,
          phonePrefix: inputs.phonePrefix,
          birthday: inputs.birthday,
        },
      });

      res.status(201).json({
        firstName: new_author.first_name,
        lastName: new_author.last_name,
        email: new_author.email});
      sendWelcomeMail(inputs.email, inputs.firstName);
    })

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
router.post('/user', addAuthor);

export default router;