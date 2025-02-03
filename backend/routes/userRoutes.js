import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createRandomPassword, matchConfirmationCode } from './../utils.js';
import bcrypt from 'bcrypt';
import { sendSetPasswordMail, sendResetPasswordMail } from './../mailer.js';
// import { authenticateUser } from './../server.js';

const prisma = new PrismaClient();
const router = express.Router();

// router.get('/checkPermissions', async (req, res) => {
//   try {
//     const response = await authenticateUser(req, res, next);
//     const data = await response.json();
//     return data;
//   } catch(error) {
//     console.log("Error running checkPermissions in userRoutes:", error);
//   }
// })

router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({where: {email: email}});
    if (user === null) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.");
    }

    if (user.email === email && (await bcrypt.compare(password, user.password))) {
      req.session.user_id =  user.id ;
      console.log("created session id with:", req.session.user_id);
      res.status(200).send(user);
    } else {
      res.status(401).json({error: "Wrong password or email address"});
    }
  } catch(error) {
    console.error(error);
  }
})

router.get('/api/user', async (req, res) => {
  try {
    const email = req.query.email;
    const user = await prisma.user.findUnique({where: {email: email}});

    if (user === null) {
      res.status(204).json("No user with this email were found");
    } else {
      sendResetPasswordMail(email, user.first_name)
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error retrieving the user:", error)
  }
})

router.post('/api/confirmation_code', async (req, res) => {
  try {
    const { confirmation_code, user_id } = req.body;
    const matched = await matchConfirmationCode(confirmation_code, user_id);

    if (matched === true) {
      const user = await prisma.user.findUnique({where: {id: user_id}});
      req.session.user_id = user.id;
      console.log("added session user id:", req.session.user_id);
      res.status(200).json({message: "All good"});
    } else {
      res.status(401).json({error: "Unauthorized"});
    }
  } catch(error) {
    console.error("Error confirming code:", error);
    res.status(500).json({error: 'A server error ocurred while confirming the code'});
  }
})

export default router;
