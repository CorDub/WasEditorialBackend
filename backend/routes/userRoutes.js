import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createRandomPassword, matchConfirmationCode } from './../utils.js';
import bcrypt from 'bcrypt';
import { sendSetPasswordMail, sendResetPasswordMail } from './../mailer.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({where: {is_admin: false}});
    res.json(users);
  } catch (error) {
    console.error(error);
  }
});

router.get('/user', async (req, res) => {
  try {
    const email = req.query.email;
    const user = await prisma.user.findUnique({where: {email: email}});

    if (user === null) {
      res.status(204).send("No user with this email were found");
    } else {
      sendResetPasswordMail(email, user.first_name)
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error retrieving the user:", error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({where: {email: email}});
    if (user === null) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.");
    }

    if (user.email === email && user.password === password) {
      req.session.user = { id: user.id, name: user.name };
      res.status(200).json({is_admin: user.is_admin});
    } else {
      res.status(401).send("Wrong password or email address");
    }
  } catch(error) {
    console.error(error);
  }
})

router.post('/user', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      country,
      referido,
      email,
      category } = req.body;
    const password = createRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const new_author =  await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        country: country,
        referido: referido,
        email: email,
        password: hashedPassword,
        categoryId: parseInt(category)
      },
    });

    res.status(201).json({name: new_author.name, email: new_author.email});
    sendSetPasswordMail(email, firstName, password);
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the user'});
  }
});

router.post('/confirmation_code', async (req, res) => {
  try {
    const { confirmation_code, user_id } = req.body;
    const matched = await matchConfirmationCode(confirmation_code, user_id);

    if (matched === true) {
      res.status(200).json({message: "All good"});
    } else {
      res.status(401).json({error: "Unauthorized"});
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server ocurred while confirming the code'});
  }
})

router.patch('/change_password', async (req, res) => {
  try {
    const { user_id, password } = req.body;
    const update = await prisma.user.update({
      where: {id: user_id},
      data: {password: password}
    });

    console.log(update);
    if (update) {
      res.status(200).json({message: "Successfully updated password"});
    } else {
      res.status(500).json({error: "There was an issue updating the password."});
    }

  } catch(error) {
    console.error("Error at the change_password route:", error);
  }
})

export default router;
