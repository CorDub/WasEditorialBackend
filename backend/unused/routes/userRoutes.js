import express from 'express';
import { matchConfirmationCode } from '../../passwordUtils.js';
import bcrypt from 'bcrypt';
import { sendResetPasswordMail } from '../../mailer.js';
import { prisma } from "../../prisma/client.js"
import { validateInputs } from '../../utils.js';
import { validateInput } from '../../validations.js';

const router = express.Router();

export async function login(req, res) {
  try {
    // const { email, password } = req.body;
    const inputs = {
      email: req.body.email,
      password: req.body.password
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const user = await prismaClient.user.findUnique({where: {email: inputs.email}});
    if (user && user.isDeleted) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.")
    }
    if (!user) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.");
    }

    if (user.email === inputs.email && (await bcrypt.compare(inputs.password, user.password))) {
      req.session.user_id =  user.id ;
      const user_send = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        referido: user.referido,
        // categoryId: user.categoryId,
        role: user.role,
        font_size: user.font_size
      }
      res.status(200).json(user_send);
    } else {
      res.status(401).json({error: "Wrong password or email address"});
    }
  } catch(error) {
    console.error(error);
  }
}
router.post('/login', login)



export async function getReset(req, res) {
  try {
    const inputs = {
      email: req.body.email
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    const user = await prismaClient.user.findUnique({where: {email: inputs.email,}});
    if (user && user.isDeleted) {
      return res.status(500).json("Error retrieving the user");
    }
    if (!user) {
      return res.status(500).json("Error retrieving the user");
    }

    await sendResetPasswordMail(inputs.email, user.first_name)
    const user_send = {
      id: user.id,
      // first_name: user.first_name,
      // last_name: user.last_name,
      // referido: user.referido,
      // categoryId: user.categoryId,
      // role: user.role,
      // font_size: user.font_size
    }
    res.status(200).json(user_send);
  } catch (error) {
    console.error("Error retrieving the user:", error)
    return res.status(500).json("Error retrieving the user");
  }
}
router.post('/reset', getReset)



export async function getUserExtra(req, res) {
  try {
    const user_id = req.session.user_id;
    if (!user_id) { 
      return res.status(401).json({message: "Unauthorized"})
    }
    const prismaClient = req.prisma || prisma

    const user = await prismaClient.user.findUnique({where: {id: user_id}});
    if (user && user.isDeleted) {
      return res.status(204).json({message: "No user found"})
    }
    if (!user) {
      return res.status(204).json({message: "No user found"});
    }

    const user_send = {
      "email": user.email,
      "phone": user.phone,
      "phonePrefix" : user.phonePrefix,
      "birthday": user.birthday,
      "font_size": user.font_size,
      "clabe": user.clabe,
      "name_bank_account": user.name_bank_account,
      "bank": user.bank,
      "swift": user.swift
    }
    res.status(200).json(user_send);
  } catch (error) {
    console.error("Error retrieving info: ", error)
    return res.status(500).json({message: "Error retrieving info"})
  }
}
router.get('/user_extra', getUserExtra)



export async function updateUser(req, res) {
  try {
    const fieldToChange = req.body;
    const permittedFields = [
      "email", "phone", "phonePrefix", "country", "birthday", 'font_size', 'clabe', "name_bank_account",
      "bank", "swift"
    ]
    for (const field of Object.entries(fieldToChange)) {
      if (!permittedFields.includes(field[0])) {
        return res.status(500).json({error: "Internal server error" })
      }

      let errors;
      if (field[0] === "font_size") {
        errors = validateInput(parseFloat(field[0]), field[1])
      } else {
        errors = validateInput(field[0], field[1])
      }

      if (errors.length > 0) {
        throw new Error (`invalid input ${errors[0]}`)
      }
    }

    const prismaClient = req.prisma || prisma

    const targetUser = await prismaClient.user.findUnique({ where: {id: req.session.user_id}})
    if (!targetUser || targetUser.isDeleted) {
      return res.status(500).json({message: "Updated"})
    }

    const updatedUser = await prismaClient.user.update({
      where: {id: req.session.user_id},
      data: {
        ...fieldToChange
      }
    });
    res.status(200).json({message: "Updated"});

  } catch (error) {
    console.error("Error when updating user: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
router.patch('/user', updateUser)



export async function getConfirmationCode(req, res) {
  try {
    const { confirmation_code, user_id } = req.body;
    if (isNaN(parseInt(confirmation_code)) || confirmation_code.toString().length < 6) {
      return res.status(500).json({error: "A server error occurred while confirming the code"});
    }

    const error = validateInput("id", user_id);
    if (error.length > 0) {
      return res.status(500).json({error: "A server error occurred while confirming the code"});
    }

    const prismaClient = req.prisma || prisma

    const matched = await matchConfirmationCode(confirmation_code, user_id, prismaClient);

    if (matched === true) {
      const user = await prismaClient.user.findUnique({where: {id: user_id}});
      if (user.isDeleted) {
        return res.status(500).json({error: "A server error occurred while confirming the code"});
      }
      req.session.user_id = user.id;
      res.status(200).json({message: "All good"});
    } else {
      res.status(500).json({error: 'A server error ocurred while confirming the code'});
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server error ocurred while confirming the code'});
  }
}
router.post('/confirmation_code', getConfirmationCode)



export async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error when destroying session in logout route', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
    });
    res.clearCookie('connect.sid');
    res.status(200).json({message: 'Logged out'});
  } catch(error) {
    console.error("Error in logout route:", error);
  }
}
router.post('/user/logout', logout)

export default router;
