import express from "express";
import { prisma } from "../../prisma/client.js";
import { validateInputs } from "../../utils.js";
import bcrypt from "bcrypt";
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

export default router