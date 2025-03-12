import express from "express";
import bcrypt from 'bcrypt';
import { prisma } from "./../server.js"

const router = express.Router();

router.patch('/change_password', async (req, res) => {
  try {
    const { user_id, password } = req.body;
    let errors = [];

    let upper = 0;
    let lower = 0;
    let number = 0;
    let special = 0;

    for (const char of password) {
      if (/[A-Z]/.test(char)) {
        upper += 1
      };

      if (/[a-z]/.test(char)) {
        lower += 1
      }

      if (/[0-9]/.test(char)) {
        number += 1
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(char)) {
        special += 1
      }
    }

    if (upper < 1 || lower < 1 || number <1 || special < 1) {
      errors.push(13)
    }

    if (password.length < 8) {
      errors.push(12)
    };

    const current_user = await prisma.user.findUnique({where: {id: user_id}});
    if (await bcrypt.compare(password, current_user.password)) {
      errors.push(14);
    }

    if (errors.length > 0) {
      res.status(400).json(errors);
      return;
    }

    const update = await prisma.user.update({
      where: {id: user_id},
      data: {password: await bcrypt.hash(password, 10)}
    });

    if (update) {
      res.status(200).json({message: "Successfully updated password"});
    } else {
      res.status(500).json({error: "There was an issue updating the password."});
    }

  } catch(error) {
    console.error("Error at the change_password route:", error);
  }
})

router.get('/books/:bookId/inventories', async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: { bookId: parseInt(req.params.bookId) }
    });

    console.log(`Found ${inventories.length} inventory records for bookId ${req.params.bookId}`);
    if (inventories.length === 0) {
      console.log("No inventory records found!");
    } else {
      console.log("First record:", inventories[0]);
    }

    res.status(200).json(inventories);
  } catch(error) {
    console.error("Error in the get inventories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching inventories'});
  }
})

export default router;
