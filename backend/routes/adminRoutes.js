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
    const users = await prisma.user.findMany({
      where: {
        is_admin: false
      },
      include: {
        category: {
          select: {
            type: true
          }
        }
      }
    });
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

    res.status(201).json({
      firstName: new_author.first_name,
      lastName: new_author.last_name,
      email: new_author.email});
    sendSetPasswordMail(email, firstName, password);
  } catch(error) {
    console.error(error);
    if (String(error).includes(("Unique constraint failed on the fields: (`email`)"))) {
      res.status(500).json({message: "El correo ya está usado"})
      return;
    }

    if (String(error).includes(("Unique constraint failed on the fields: (`first_name`,`last_name`)"))) {
      res.status(500).json({message: "Un autor con el mismo nombre completo ya existe"})
      return;
    }
    res.status(500).json({ error: error });
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
      categoryId } = req.body;
    const updatedAuthor = await prisma.user.update({
      where: {id: id},
      data: {
        first_name: first_name,
        last_name: last_name,
        country: country,
        referido: referido,
        email: email,
        category: {
          connect: {
            id: categoryId
          }
        }
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

router.get('/categories-type', async (req, res) => {
  try {
    const categories_type = await prisma.category.findMany({
      select: {
        id: true,
        type: true
      }
    });
    // let type_list = [];
    // categories_type.forEach((category) => {
    //   type_list.push(String(category.type))
    // })
    res.status(200).json(categories_type);
  } catch(error) {
    console.error("Error in the get categories-type route:", error);
    res.status(500).json({error: "A server error occurred while fetching categories-type"});
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

router.get('/book', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    books.map((book) => {
      book.authorNames = "";
      book.users.map((user) => {
        if (book.authorNames === "") {
          book.authorNames = ((user.first_name + " " + user.last_name))
        } else {
          book.authorNames += (", " + ((user.first_name + " " + user.last_name)))
        }
      })
    })

    res.status(200).json(books);
  } catch(error) {
    console.error("Error in the get books route:", error);
    res.status(500).json({error: 'A server error occurred while fetching books'});
  }
})

router.post('/book', async (req, res) => {
  try {
    const {
      title,
      pasta,
      price,
      isbn,
      authors } = req.body;

    const authorsIds = []
    authors.map((authorId) => {
      authorsIds.push({"id": authorId});
    })

    const new_book = await prisma.book.create({
      data: {
        title: title,
        pasta: pasta,
        price: parseFloat(price),
        isbn: isbn,
        users: {
          connect: authorsIds,
        },
      }
    });

    res.status(201).json({title: new_book.title});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the book'});
  }
});

router.delete('/book', async (req, res) => {
  try {
    const book_id = parseInt(req.query.book_id);
    await prisma.book.delete({where: {id: book_id}});
    res.status(200).json({message: "Deleted successfully"})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the book'});
  }
})

router.patch('/book', async (req, res) => {
  try {
    const {
      id,
      title,
      pasta,
      price,
      isbn,
      authors } = req.body;

    const authorsIds = []
    authors.map((authorId) => {
      authorsIds.push({"id": authorId});
    })

    const updatedBook = await prisma.book.update({
      where: {id: id},
      data: {
        title: title,
        pasta: pasta,
        price: parseFloat(price),
        isbn: isbn,
        users: {
          connect: authorsIds,
        }
      }
    });

    console.log(updatedBook);
    if (updatedBook) {
      res.status(200).json({message: "Successfully updated book"});
    } else {
      res.status(500).json({error: "There was an issue updating the book"});
    };

  } catch(error) {
    console.error("Server error at the update book route:", error);
  }
});

// Bookstores routes

router.get('/bookstore', async (req, res) => {
  try {
    const bookstores = await prisma.bookstore.findMany();
    res.status(200).json(bookstores);
  } catch(error) {
    console.error("Error in the get bookstores route:", error);
    res.status(500).json({error: 'A server error occurred while fetching bookstores'});
  }
})

router.post('/bookstore', async (req, res) => {
  try {
    const {
      name,
      dealPercentage,
      contactName,
      contactPhone,
      contactEmail } = req.body;
    const new_bookstore =  await prisma.bookstore.create({
      data: {
        name: name,
        deal_percentage: parseFloat(dealPercentage),
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      },
    });

    res.status(201).json({name: new_bookstore.name});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
})

router.patch('/bookstore', async (req, res) => {
  try {
    const {
      id,
      name,
      dealPercentage,
      contactName,
      contactPhone,
      contactEmail } = req.body;
    const updatedBookstore = await prisma.bookstore.update({
      where: {id: id},
      data: {
        name: name,
        deal_percentage: parseFloat(dealPercentage),
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      }
    });

    console.log(updatedBookstore);
    if (updatedBookstore) {
      res.status(200).json({message: "Successfully updated bookstore"});
    } else {
      res.status(500).json({error: "There was an issue updating the bookstore"});
    };

  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
  }
});

router.delete('/bookstore', async (req, res) => {
  try {
    const bookstore_id = parseInt(req.query.bookstore_id);
    await prisma.bookstore.delete({where: {id: bookstore_id}});
    res.status(200).json({message: "Deleted successfully"})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the bookstore'});
  }
})

export default router;
