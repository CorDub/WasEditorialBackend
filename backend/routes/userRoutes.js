import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

router.get('/users', async (req,res) => {
  try {
    const users = await prisma.user.findMany();
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
      res.status(200).json({message:"Welcome"});
    } else {
      res.status(401).send("Wrong password or email address");
    }
  } catch(error) {
    console.error(error);
  }
})

export default router;
