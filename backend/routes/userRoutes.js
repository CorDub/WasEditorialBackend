import express from 'express';
import { matchConfirmationCode } from './../utils.js';
import bcrypt from 'bcrypt';
import {sendResetPasswordMail } from './../mailer.js';
import { prisma } from "./../server.js"

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email: email,
        isDeleted: false
      }});
    if (user === null) {
      return res.status(401).send("No tenemos una cuenta registrada con este correo.");
    }

    if (user.email === email && (await bcrypt.compare(password, user.password))) {
      req.session.user_id =  user.id ;
      // await new Promise((resolve) => req.session.save(resolve));
      console.log("created session id with:", req.session.user_id);
      const user_send = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        referido: user.referido,
        email: user.email,
        categoryId: user.categoryId,
        role: user.role
      }
      res.status(200).send(user_send);
    } else {
      res.status(401).json({error: "Wrong password or email address"});
    }
  } catch(error) {
    console.error(error);
  }
})

router.get('/user', async (req, res) => {
  try {
    const email = req.query.email;
    const user = await prisma.user.findUnique({where: {
      email: email,
      isDeleted: false
    }});

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

router.post('/confirmation_code', async (req, res) => {
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

router.post('/logout', async (req, res) => {
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
})

export default router;
