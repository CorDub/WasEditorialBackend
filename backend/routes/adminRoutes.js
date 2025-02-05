import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { createRandomPassword } from './../utils.js';

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

router.delete('/user', async (req, res) => {
  try {
    const user_id = parseInt(req.query.user_id);
    await prisma.user.delete({where: {id: user_id}});
    res.status(200).json({message: "Deleted successfully"})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the user'});
  }
})

export default router;
