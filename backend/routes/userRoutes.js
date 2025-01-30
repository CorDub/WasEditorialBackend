import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createRandomPassword, matchConfirmationCode } from './../utils.js';
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { json } from 'stream/consumers';

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({where: {email: email}});
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
    const { name, email } = req.body;
    const password = createRandomPassword();
    // const hashedPassword = await bcrypt.hash(password, 10);
    const new_author =  await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: password
      },
    });
    res.status(201).json({name: new_author.name, email: new_author.email});
    sendSetPasswordMail(email, name);
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the user'});
  }
});

router.post('/confirmation_code', async (req, res) => {
  try {
    const { confirmation_code, email } = req.body;
    console.log(email);
    const matched = await matchConfirmationCode(confirmation_code, email);

    if (matched === true) {
      res.status(200);
    } else {
      res.status(401);
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server ocurred while confirming the code'});
  }
})

export default router;
