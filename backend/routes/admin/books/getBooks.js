import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function getBooks(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma

    const books = await prismaClient.book.findMany({
      where: {
        isDeleted: false
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        },
        inventories: {
          select: {
            id: true,
            bookstore: {
              select: {
                name: true
              },
            },
            bookstoreId: true,
            price: true
          }
        },
        category: {
          select: {
            number: true
          }
        }
      },
      orderBy: {
        title: "asc"
      }
    });

    books.map((book) => {
      book.authorNames = "";
      book.users.map((user) => {
        for (const inv of book.inventories) {
          if (inv.bookstoreId === 1) {
            book.price = inv.price
          }
        }

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
}
router.get('/book', getBooks);

export default router;
