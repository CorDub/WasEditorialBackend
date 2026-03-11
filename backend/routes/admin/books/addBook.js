import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function addBook(req, res) {
  try {
    const inputs = {
      "title": req.body.title,
      "pasta": req.body.pasta,
      "price": parseFloat(req.body.price),
      "isbn": req.body.isbn !== "" ? req.body.isbn : null,
      "quantity": parseInt(req.body.quantity),
      "categoryId": parseInt(req.body.category),
      "dateStr": req.body.date
    }
    validateInputs(inputs)

    // validate author Ids one at a time, not as a group
    const authorsIds = []
    req.body.authors.map((authorId) => {
      const error = validateInput("id", authorId);
      if (error.length > 0) {
        throw new Error (`invalid input, ${error[0]}`);
      }
      authorsIds.push({"id": parseInt(authorId)});
    })

    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      //before creating the book we check for duplicates
      const possiblyDeletedBooks = await tx.book.findMany({
        where: {
          AND: [
            {
              title: {
                startsWith: inputs.title
              }
            },
            {
              mainAuthor: authorsIds[0].id
            }
          ]
        }
      })

      if (possiblyDeletedBooks.length === 1 && possiblyDeletedBooks[0].isDeleted) {
        const deletedBook = await tx.book.update({
          where: {
            id: possiblyDeletedBooks[0].id
          },
          data: {
            title: possiblyDeletedBooks[0].title + "_deleted",
            isbn: null,
          }
        })
      } 

      if (possiblyDeletedBooks.length > 1) {
        const lastDeletedBook = await tx.book.findUnique({
          where: {
            title_mainAuthor: {
              title: inputs.title,
              mainAuthor: authorsIds[0].id
            }
          }
        })
        if (lastDeletedBook && lastDeletedBook.isDeleted) {
          const updatedLastDeletedBook = await tx.book.update({
            where: {
              id: lastDeletedBook.id
            },
            data: {
              title: inputs.title + "_deleted" + possiblyDeletedBooks.length,
              isbn: null
            }
          })
        }
      }

      //once we've cleared the way we create the book.
      const new_book = await tx.book.create({
        data: {
          title: inputs.title,
          pasta: inputs.pasta,
          isbn: inputs.isbn,
          users: {
            connect: authorsIds,
          },
          mainAuthor: authorsIds[0].id,
          category: {
            connect: {"id": inputs.categoryId}
          }
        }
      });

      let new_impression;
      if (new_book) {
        new_impression = await tx.impression.create({
          data: {
            bookId: new_book.id,
            quantity: inputs.quantity,
            dateStr: inputs.dateStr
          }
        })
      };

      let new_inventory;
      if (new_impression) {
        new_inventory = await tx.inventory.create({
          data: {
            bookId: new_book.id,
            bookstoreId: 1,
            country: "México",
            price: inputs.price,
            initial: inputs.quantity,
            current: inputs.quantity
          }
        })
      }

      res.status(201).json({title: new_book.title});
    })

  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`isbn`)"))) {
      res.status(500).json({message: "Este ISBN ya existe"})
      return;
    }

    if (String(error).includes(("Unique constraint failed on the fields: (`title`,`mainAuthor`)"))) {
      res.status(500).json({message: "Un libro con el mismo título y autor ya existe."})
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the book'});
  }
}
router.post('/book', addBook);

export default router;