import express from "express";
import { prisma } from "../../../prisma/client.js";
const router = express.Router();

export async function addMultipleBooks(req, res) {
  try {
    const csvfile = req.files.archivo[0];
    if (!csvfile || !csvfile.originalname.endsWith(".csv")) {
      return res.status(400).json({"error": "file is not a .csv"});
    }

    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient
    const prismaClient = req.prisma || prisma;

    const fileContent = csvfile.buffer.toString('utf-8');
    const lines = fileContent.split("\n");
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        let fields = lines[i].split(",");
        for (let j = 0; j < 8; j++) {
          if (!fields[j]) {
            fields[j] = null;
            continue;
          }

          fields[j] = fields[j].trim();
          if (fields[j] === "") {
            fields[j] = null
          }
        }
        if (!fields[0]) {
          throw new Error("Missing title");
        }
        if (!fields[1] || !fields[2]) {
          throw new Error("Missing author");
        }
        if (!fields[3]) {
          throw new Error("Missing price");
        }
        if (!fields[4]) {
          throw new Error("Missing category number");
        }
        if (!fields[5]) {
          throw new Error("Missing quantity");
        }
        if (fields[6] !== "Blanda" 
          && fields[6] !== "Dura" 
          && fields[6] !== null) {
          throw new Error("Invalid pasta");
        }

        const inputs = {
          "title": fields[0],
          "firstName": fields[1],
          "lastName": fields[2],
          "price": parseFloat(fields[3]),
          "categoryId": parseInt(fields[4]),
          "quantity": parseInt(fields[5]),
          "pasta": fields[6],
          "isbn": fields[7],
        }
        validateInputs(inputs);

        const deletedBook = await prismaClient.book.findFirst({
          where: {
            title: inputs.title,
            isDeleted: true
          }
        })

        if (deletedBook) {
          await prismaClient.user.delete({
            where: {
              title: inputs.title
            }
          });
        }

        const author = await prismaClient.user.findUnique({
          where: {
            first_name_last_name: {
              first_name: inputs.firstName,
              last_name: inputs.lastName
            }
          }
        })

        if (!author) {
          throw new Error(`Author not found`);
        }

        try {
          await prismaClient.$transaction(async (tx) => {
            const addedBook = await tx.book.create({
              data: {
                title: inputs.title,
                pasta: inputs.pasta,
                isbn: inputs.isbn,
                users: {
                  connect: {
                    id: author.id
                  }
                },
                mainAuthor: author.id,
                categoryId: inputs.categoryId
              }
            });

            const new_impression = await tx.impression.create({
              data: {
                bookId: addedBook.id,
                quantity: inputs.quantity,
              }
            })

            const new_inventory = await tx.inventory.create({
              data: {
                bookId: addedBook.id,
                bookstoreId: 1,
                price: inputs.price,
                initial: inputs.quantity,
                current: inputs.quantity
              }
            })
          })
        } catch(error) {
          throw error;
        }

      } catch (error) {
        switch (true) {
          case error.toString().includes("Missing price in WAS"):
            errors.push({"line": i + 1, "error": "Faltó el precio en WAS."})
            break;
          case error.toString().includes("Missing title"):
            errors.push({"line": i + 1, "error": "Faltó el título."})
            break;
          case error.toString().includes("Missing author"):
            errors.push({"line": i + 1, "error": "Faltó el nombre o el appellido del autor."})
            break;
          case error.toString().includes("Author not found"):
            errors.push({"line": i + 1, "error": "Este autor no existe en la base de datos."})
            break;
          case error.toString().includes("Invalid pasta"):
            errors.push({"line": i + 1, "error": "La pasta no era 'Blanda' o 'Dura'"})
            break;
          case error.toString().includes("Missing quantity"):
            errors.push({"line": i + 1, "error": "Faltó la cantidad inicial imprimida."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`title`)"):
            errors.push({"line": i + 1, "error": "Este título ya existe."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`isbn`)"):
            errors.push({"line": i + 1, "error": "Este isbn ya existe."})
            break;
          default:
            console.error(error);
            errors.push({"line": i + 1, "error": "Error non identificada"})
        }
      }
    }

    res.status(200).json({"message": "added multiple books", "failed": errors});
  } catch(error) {
    console.error(error);
    res.status(500).json({"error": "A server error occured while creating the books"})
  }
}
router.post('/book/addMultiples', upload.fields([{name: "archivo", maxCount: 1}]), addMultipleBooks);

export default router;