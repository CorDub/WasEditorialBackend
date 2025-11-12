import express from 'express';
import { matchConfirmationCode } from './../passwordUtils.js';
import bcrypt from 'bcrypt';
import { sendResetPasswordMail } from './../mailer.js';
import { prisma } from "../prisma/client.js"
import { validateInputs } from '../utils.js';

const router = express.Router();

export async function login(req, res) {
  try {
    // const { email, password } = req.body;
    const inputs = {
      email: req.body.email,
      password: req.body.password
    }
    validateInputs(inputs);

    const user = await prisma.user.findUnique({where: {email: inputs.email}});
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
        categoryId: user.categoryId,
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

    const user = await prisma.user.findUnique({where: {email: inputs.email,}});
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
    const user = await prisma.user.findUnique({where: {
      id: user_id,
      isDeleted: false
    }});

    if (user === null) {
      res.status(204).json("No user found");
    } else {
      const user_send = {
        "email": user.email,
        "phone": user.phone,
        "birthday": user.birthday,
        "font_size": user.font_size,
        "clabe": user.clabe,
        "name_bank_account": user.name_bank_account,
        "bank": user.bank,
        "swift": user.swift
      }
      res.status(200).json(user_send);
    }
  } catch (error) {
    console.error("Error retrieving info: ", error)
  }
}
router.get('/user_extra', getUserExtra)

export async function updateUser(req, res) {
  try {
    const fieldToChange = req.body;
    const updatedUser = await prisma.user.update({
      where: {id: req.session.user_id},
      data: {
        ...fieldToChange
      }
    });

    if (updatedUser) {
      res.status(200).json({message: "Updated"});
    } else {
      res.status(500).json({error: "There was an issue updating the user details"});
    }

  } catch (error) {
    console.error("Error when updating user: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
router.patch('/user', updateUser)

export async function getConfirmationCode(req, res) {
  try {
    const { confirmation_code, user_id } = req.body;
    const matched = await matchConfirmationCode(confirmation_code, user_id);

    if (matched === true) {
      const user = await prisma.user.findUnique({where: {id: user_id}});
      req.session.user_id = user.id;
      res.status(200).json({message: "All good"});
    } else {
      res.status(401).json({error: "Unauthorized"});
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
    res.json({message: 'Logged out'});
  } catch(error) {
    console.error("Error in logout route:", error);
  }
}
router.post('/logout', logout)

export default router;
