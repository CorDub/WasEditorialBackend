import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { createRandomPassword } from './../utils.js';

const prisma = new PrismaClient();
const router = express.Router();

// User routes

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

router.patch('/user', async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      country,
      referido,
      email,
      category } = req.body;
    const updatedAuthor = await prisma.user.update({
      where: {id: id},
      data: {
        first_name: first_name,
        last_name: last_name,
        country: country,
        referido: referido,
        email: email,
        category: category
      }
    });

    console.log(updatedAuthor);
    if (updatedAuthor) {
      res.status(200).json({message: "Successfully updated user"});
    } else {
      res.status(500).json({error: "There was an issue updating the author"});
    };

  } catch(error) {
    console.error("Server error at the update user route:", error);
  }
})

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

//Categories routes

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch(error) {
    console.error("Error in the get categories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching categories'});
  }
})

router.delete('/category', async (req, res) => {
  try {
    const category_id = parseInt(req.query.category_id);
    await prisma.category.delete({where: {id: category_id}});
    res.status(200).json({message: "Deleted successfully"})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the category'});
  }
})

router.post('/category', async (req, res) => {
  try {
    const {
      tipo,
      regalias,
      gestionTiendas,
      gestionMinima } = req.body;
    const new_category =  await prisma.category.create({
      data: {
        type: parseInt(tipo),
        percentage_royalties: parseInt(regalias),
        percentage_management_stores: parseInt(gestionTiendas),
        management_min: parseInt(gestionMinima),
      },
    });

    res.status(201).json({name: new_category.type});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
});

router.patch('/category', async (req, res) => {
  try {
    const {
      id,
      tipo,
      regalias,
      gestionTiendas,
      gestionMinima } = req.body;
    const updatedCategory = await prisma.category.update({
      where: {id: id},
      data: {
        type: parseInt(tipo),
        percentage_royalties: parseInt(regalias),
        percentage_management_stores: parseInt(gestionTiendas),
        management_min: parseInt(gestionMinima),
      }
    });

    console.log(updatedCategory);
    if (updatedCategory) {
      res.status(200).json({message: "Successfully updated category"});
    } else {
      res.status(500).json({error: "There was an issue updating the category"});
    };

  } catch(error) {
    console.error("Server error at the update category route:", error);
  }
});

// Book routes

router.get('/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    books.map((book) => {
      book.authorName = book.user.first_name + " " + book.user.last_name
    })
    
    res.status(200).json(books);
  } catch(error) {
    console.error("Error in the get books route:", error);
    res.status(500).json({error: 'A server error occurred while fetching books'});
  }
})

export default router;
