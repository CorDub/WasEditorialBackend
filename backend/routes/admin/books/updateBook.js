import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function updateBook(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "title": req.body.title,
      "pasta": req.body.pasta,
      "isbn": req.body.isbn,
      "categoryId": parseInt(req.body.category)
    }
    validateInputs(inputs);

    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const authors = req.body.authors;
    const authorsIds = []
    authors.map((author) => {
      const error = validateInput('id', author.id);
      if (error.length > 0) {
        throw new Error (`invalid input ${error[0]}`)
      }
      authorsIds.push({"id": author.id});
    })

    await prismaClient.$transaction(async (tx) => {
      const previousBook = await tx.book.findUnique({
        where: {id: inputs.id},
        select: {
          users: {
            select: {
              id: true
            }
          }
        }
      });

      if (previousBook.isDeleted) {
        throw new Error("This book is deleted");
      }

      const updatedBook = await tx.book.update({
        where: {id: inputs.id},
        data: {
          title: inputs.title,
          pasta: inputs.pasta,
          isbn: inputs.isbn,
          users: {
            set: authorsIds,
          },
          mainAuthor: authorsIds[0].id,
          category: {
            connect: {"id": inputs.categoryId}
          }
        }
      });

      res.status(200).json({message: "Successfully updated book"});
    })

  } catch(error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the book"});
  }
}
router.patch('/book/:id', updateBook);

export default router;