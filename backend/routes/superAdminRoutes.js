import { Role } from "@prisma/client";
import { prisma } from "../prisma/client.js"
import express from "express";
import { createRandomPassword, validateInputs } from "../utils.js";
import bcrypt from "bcrypt";
import { sendSetPasswordMail } from "../mailer.js";

const router = express.Router();

router.get('/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.admin, Role.superadmin] },
        isDeleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      },
      orderBy: [
        {last_name: 'asc'},
        {first_name: 'asc'}
      ]
    });

    res.json(admins);
  } catch (error) {
    console.error(error);
  }
});

export async function addAdmin (req, res) {
  try {
    const inputs = {
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "email": req.body.email,
      "role": req.body.role
    }
    validateInputs(inputs);

    /// NOW START DOING STUFF
    const password = createRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const new_admin = await prisma.user.create({
      data: {
        first_name: inputs.firstName,
        last_name: inputs.lastName,
        email: inputs.email,
        password: hashedPassword,
        role: inputs.role
      }
    })

    res.status(201).json({
      firstName: new_admin.first_name,
      lastName: new_admin.last_name,
      email: new_admin.email
    });
    sendSetPasswordMail(inputs.email, inputs.firstName, inputs.lastName);

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

router.patch('/admin', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role} = req.body;
    const admin = await prisma.user.findUnique({where: {
      first_name_last_name: {
        first_name: firstName,
        last_name: lastName
      }
    }})
    const updatedAdmin = await prisma.user.update({
      where: {id: admin.id},
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: role
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
})

router.delete('/admin/:id', async (req, res) => {
  const user_id = parseInt(req.params.id);

  try {
    await prisma.user.update({where:
      {id: user_id},
      data: {
        isDeleted: true,
      }
    });
    res.status(200).json({message: "El admin ha sido eliminado con exito."})
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the admin'});
  }
})

export default router;
