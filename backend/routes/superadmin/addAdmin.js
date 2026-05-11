import express from "express";
import { prisma } from "../../prisma/client.js";
const router = express.Router();
import { validateInputs } from "../../utils.js";
import { sendWelcomeMail } from "../../mailer.js";

export async function addAdmin (req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const inputs = {
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "email": req.body.email,
      "role": req.body.role
    }
    validateInputs(inputs);

    // const password = createRandomPassword();
    // const hashedPassword = await bcrypt.hash(password, 10);
    let new_admin;
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
        // new_admin = revivedUser;
      } 

      new_admin = await tx.user.create({
        data: {
          first_name: inputs.firstName,
          last_name: inputs.lastName,
          email: inputs.email,
          // password: hashedPassword,
          role: inputs.role
        }
      })
    })

    res.status(201).json({
      firstName: new_admin.first_name,
      lastName: new_admin.last_name,
      email: new_admin.email
    });
    
    sendWelcomeMail(new_admin.email, new_admin.first_name)
    // sendSetPasswordMail(inputs.email, inputs.firstName, hashedPassword);

  } catch (error) {
    console.error(error);
    if (String(error).includes(("Unique constraint failed on the fields: (`email`)"))) {
      res.status(409).json({message: "El correo ya está usado"})
      return;
    }

    if (String(error).includes(("Unique constraint failed on the fields: (`first_name`,`last_name`)"))) {
      res.status(409).json({message: "Un autor con el mismo nombre completo ya existe"})
      return;
    }
    res.status(500).json({ error: error });
  }
}
router.post('/admin', addAdmin);

export default router;