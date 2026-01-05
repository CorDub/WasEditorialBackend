import { Role } from "@prisma/client";
import express from "express";
import bcrypt from 'bcrypt';
import { sendSetPasswordMail } from './../mailer.js';
import { 
  calculateAuthorRevenue, 
  getForMonth, 
  twelveMonthsAgo, 
  generateMonthKeysForRange,
  getAuthorString 
} from './../utils.js';
import { prisma } from "../prisma/client.js";
import multer from "multer";
import { validateInput } from "../validations.js";
import { validateInputs } from "./../utils.js";
import { createRandomPassword } from "../passwordUtils.js";

const upload = multer();
const router = express.Router();

// User routes

export async function getAuthors(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const users = await prismaClient.user.findMany({
      where: {
        role: Role.author,
        isDeleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        country: true,
        referido: true,
        email: true,
        phone: true,
        birthday: true,
        clabe: true,
        name_bank_account: true,
        bank: true,
        swift: true,
        category: {
          where: {
            isDeleted: false
          },
          select: {
            type: true
          }
        }
      },
      orderBy: [
        {first_name: 'asc'},
        {last_name: 'asc'}
      ]
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at users route"});
  }
}
router.get('/users', getAuthors);



export async function addAuthor(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient
    const prismaClient = req.prisma || prisma;

    const inputs = {
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "country": req.body.country,
      "referido": req.body.referido,
      "email": req.body.email,
      "phone": req.body.phone,
      "birthday": req.body.birthday,
      "category": parseInt(req.body.category)
    }
    validateInputs(inputs);

    await prismaClient.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: {
          first_name_last_name: {
            first_name: inputs.firstName,
            last_name: inputs.lastName
          }
        }
      });

      const password = createRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      if (existing) {
        if (existing.isDeleted === false) {
          res.status(500).json({message: "Este usuario ya existe"})
          return;
        }

        //User necromancy right here - for later restore.

        // const exhumedUser = await tx.user.update({
        //   where: {id: existing.id},
        //   data: {
        //     first_name: inputs.firstName,
        //     last_name: inputs.lastName,
        //     country: inputs.country,
        //     referido: inputs.referido,
        //     email: inputs.email,
        //     phone: inputs.phone,
        //     birthday: inputs.birthday,
        //     password: hashedPassword,
        //     categoryId: inputs.category,
        //     isDeleted: false
        //   }
        // });
        // res.status(201).json({
        //   firstName: exhumedUser.first_name,
        //   lastName: exhumedUser.last_name,
        //   email: exhumedUser.email});
        // sendSetPasswordMail(email, firstName, password);
        // return;
      }

      const new_author =  await tx.user.create({
        data: {
          first_name: inputs.firstName,
          last_name: inputs.lastName,
          country: inputs.country,
          referido: inputs.referido,
          email: inputs.email,
          phone: inputs.phone,
          birthday: inputs.birthday,
          password: hashedPassword,
          categoryId: inputs.category
        },
      });

      res.status(201).json({
        firstName: new_author.first_name,
        lastName: new_author.last_name,
        email: new_author.email});
      sendSetPasswordMail(inputs.email, inputs.firstName, hashedPassword);
    })

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
}
router.post('/user', addAuthor);



export async function addMultipleAuthors(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient
    const prismaClient = req.prisma || prisma;
    const csvfile = req.files.archivo[0];
    if (!csvfile || !csvfile.originalname.endsWith(".csv")) {
      return res.status(400).json({"error": "file is not a .csv"});
    }
    const fileContent = csvfile.buffer.toString('utf-8');
    const lines = fileContent.split("\n");

    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const fields = lines[i].split(",");
        const inputs = {
          firstName: fields[0],
          lastName: fields[1],
          country: fields[2],
          categoryId: parseInt(fields[3]),
          email: fields[4],
          phone: fields[5],
          birthday: fields[6],
          clabe: fields[7],
          name_bank_account: fields[8],
          bank: fields[9],
          swift: fields[10],
          referido: fields[11]
        }
        validateInputs(inputs);

        for (let j = 0; j < fields.length; j++) {
          if (fields[j] === "") {
            fields[j] = null
          }
        }
        // if (!fields[0] || !fields[1]) {
        //   throw new Error("Missing first name or last name");
        // }

        const deletedAuthor = await prismaClient.user.findFirst({
          where: {
            first_name: fields[0],
            last_name: fields[1],
            isDeleted: true
          }
        })

        if (deletedAuthor) {
          await prismaClient.user.delete({
            where: {
              first_name_last_name: {
                first_name: fields[0],
                last_name: fields[1],
              }
            }
          });
        }

        const password = createRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const addedAuthor = await prismaClient.user.create({
          data: {
            first_name: fields[0],
            last_name: fields[1],
            country: fields[2],
            categoryId: parseInt(fields[3]),
            email: fields[4],
            phone: fields[5],
            birthday: fields[6],
            clabe: fields[7],
            name_bank_account: fields[8],
            bank: fields[9],
            swift: fields[10],
            password: hashedPassword,
            referido: fields[11]
          }
        })

        if (addedAuthor) {
          sendSetPasswordMail(addedAuthor.email, addedAuthor.first_name, password);
        }
      } catch (error) {
        console.error(error)
        switch (true) {
          case error.toString().includes("Missing first name or last name"):
            errors.push({"line": i + 1, "error": "Faltó el nombre o appellido."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`email`)"):
            errors.push({"line": i + 1, "error": "Este correo ya está tomado."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`clabe`)"):
            errors.push({"line": i + 1, "error": "Este clabe ya está tomada."})
            break;
          case error.message.includes("Unique constraint failed on the fields: (`first_name`,`last_name`)"):
            errors.push({"line": i + 1, "error": "Este autor ya existe."})
            break;
          default:
            errors.push({"line": i + 1, "error": error})
        }   
      }
    }

    res.status(200).json({"message": "added multiple authors", "failed": errors});
  } catch(error) {
    res.status(500).json({"error": error});
  }
}
router.post('/api/author/addMultiples', upload.fields([{name: "archivo", maxCount: 1}]), addMultipleAuthors);



export async function updateAuthor(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;
    const inputs = {
      "id": parseInt(req.params.id),
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "country": req.body.country,
      "referido": req.body.referido,
      "email": req.body.email,
      "phone": req.body.phone,
      "birthday": req.body.birthday,
      "categoryId": parseInt(req.body.categoryId)
    }
    validateInputs(inputs);

    await prismaClient.$transaction(async (tx) => {
      const updatedAuthor = await tx.user.update({
        where: {id: inputs.id},
        data: {
          first_name: inputs.firstName,
          last_name: inputs.lastName,
          country: inputs.country,
          referido: inputs.referido,
          email: inputs.email,
          phone: inputs.phone,
          birthday: inputs.birthday,
          category: {
            connect: {
              id: inputs.categoryId
            }
          }
        },
        include: {
          category: true
        }
      });

      if (updatedAuthor) {
        res.status(200).json({message: "Successfully updated user"});
      } else {
        res.status(500).json({error: "There was an issue updating the author"});
      };
    })

  } catch(error) {
    console.error("Server error at the update user route:", error);
    res.status(500).json({error: "There was an issue updating the author"});
  } 
}
router.patch('/user/:id', updateAuthor);



export async function deleteAuthor(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    };
    validateInputs(inputs);
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      const deletedAuthor = await tx.user.update({
        where: {id: inputs.id},
        data: {isDeleted: true}
      });

      if (deletedAuthor) {
        const deletedBooksIds = await softDeleteBooksOnCascade(deletedAuthor, tx);
        for (const bookId of deletedBooksIds) {
          await Promise.all([
            softDeleteImpressionsOnCascade(bookId, tx),
            softDeleteKindleSalesOnCascade(bookId, tx),
            softDeleteCostsOnCascade(bookId, tx),
          ]);
        }
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade(deletedBooksIds, "books", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        const deletedPayments = await softDeletePaymentsOnCascade(deletedAuthor, tx);
      };
    })

    res.status(200).json({message: "El autor ha sido eliminado (recuperable) con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the user'});
  }
}
router.delete('/user/:id', deleteAuthor);



//Categories routes

export async function getCategories(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const categories = await prismaClient.category.findMany({where: {isDeleted: false}});
    res.status(201).json(categories);
  } catch(error) {
    console.error("Error in the get categories route:", error);
    res.status(500).json({error: 'A server error occurred while fetching categories'});
  }
}
router.get('/categories', getCategories);



export async function getCategoryTypes(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const categories_type = await prismaClient.category.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        type: true
      }
    });
    res.status(200).json(categories_type);
  } catch(error) {
    console.error("Error in the get categories-type route:", error);
    res.status(500).json({error: "A server error occurred while fetching categories-type"});
  }
}
router.get('/categories-type', getCategoryTypes);



export async function getImpactedUsers(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const category = await prismaClient.category.findUnique({
      where: {
        id: inputs.id
      },
      select: {
        users: true
      }
    })

    res.status(200).json({numImpactedUsers: category.users.length})
  } catch (error) {
    console.error("Error in the get Impacted Users route:", error);
    res.status(500).json({error: "A server error occurred while fetching number of impacted users"})
  }
}
router.get('/categoryImpactedUsers/:id', getImpactedUsers)



export async function deleteCategory(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "categoryId": parseInt(req.body.selectedCategory)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      if (inputs.categoryId !== 0) {
        const impactedUsers = await tx.user.findMany({
          where: {
            categoryId: inputs.id
          }
        });

        for (const user of impactedUsers) {
          if (!user.isDeleted) {
            await tx.user.update({where: {id: user.id}, data: {categoryId: inputs.categoryId}})
          } else {
            await tx.user.update({where: {id: user.id}, data: {categoryId: null}})
          }
        };
      };

      const deletedCategory = await tx.category.update({
        where: {id: inputs.id},
        data: {isDeleted: true}
      });
    })
    
    res.status(200).json({message: "La categoria ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the category'});
  }
}
router.delete('/category/:id', deleteCategory)



export async function addCategory(req, res) {
  try {
    const inputs = {
      "categoryType": req.body.tipo,
      "gestionMinima": parseFloat(req.body.gestionMinima)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: {
          type: inputs.categoryType
        }
      });

      if (existing) {
        if (existing.isDeleted === false) {
          console.error("This category already exists")
          res.status(500).json({message: "Esta categoria ya existe"})
          return;
        }

        const exhumedUser = await tx.user.update({
          where: {id: existing.id},
          data: {
            type: inputs.categoryType,
            // percentage_royalties: parseFloat(regalias),
            // percentage_management_stores: parseFloat(gestionTiendas),
            management_min: inputs.gestionMinima,
            isDeleted: false
          }
        });
        res.status(201).json({name: exhumedUser.type});
        return;
      }

      const new_category =  await tx.category.create({
        data: {
          type: inputs.categoryType,
          // percentage_royalties: parseFloat(regalias),
          // percentage_management_stores: parseFloat(gestionTiendas),
          management_min: inputs.gestionMinima,
        },
      });

      res.status(201).json({name: new_category.type});
    })
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`type`)"))) {
      console.error(error)
      res.status(500).json({message: "Uniqueness error - tipo"})
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
}
router.post('/category', addCategory);



export async function updateCategory(req, res) {
  try {
    const inputs =  {
      id: parseInt(req.params.id),
      categoryType: req.body.tipo,
      gestionMinima: parseFloat(req.body.gestionMinima)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const previousCategory = await tx.category.findUnique({
        where: {id: inputs.id}
      });

      if (previousCategory.isDeleted) {
        throw new Error("this category is deleted")
      }

      const updatedCategory = await tx.category.update({
        where: {id: inputs.id},
        data: {
          type: inputs.categoryType,
          management_min: inputs.gestionMinima,
        }
      });
    })

    res.status(200)
  } catch(error) {
    if (String(error).includes(("Unique constraint failed on the fields: (`type`)"))) {
      res.status(500).json({message: "Uniqueness error - tipo"})
      return;
    }

    console.error("Server error at the update category route:", error);
    res.status(500).json({error: error})
  }
}
router.patch('/category', updateCategory);



// Books routes

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



export async function getExistingBookTitles(req, res) {
  try {
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;
    const existingBooks = await prismaClient.book.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        inventories: {
          select: {
            bookstoreId: true
          }
        }
      },
      orderBy: {
        title: "asc"
      }
    });
    res.status(200).json(existingBooks);
  } catch (error) {
    console.error("Error while fetching existingBooks in the backend:", error);
    res.status(500).json({error: "A server error occurred while fetching existingBooks"});
  }
}
router.get('/existingBooks', getExistingBookTitles);


export async function addBook(req, res) {
  try {
    const inputs = {
      "title": req.body.title,
      "pasta": req.body.pasta,
      "price": parseFloat(req.body.price),
      "isbn": req.body.isbn,
      "quantity": parseInt(req.body.quantity)
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
      const new_book = await tx.book.create({
        data: {
          title: inputs.title,
          pasta: inputs.pasta,
          isbn: inputs.isbn,
          users: {
            connect: authorsIds,
          },
        }
      });

      let new_impression;
      if (new_book) {
        new_impression = await tx.impression.create({
          data: {
            bookId: new_book.id,
            quantity: inputs.quantity,
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

    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the book'});
  }
}
router.post('/book', addBook);



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
        const fields = lines[i].split(",");
        for (let j = 0; j < fields.length; j++) {
          fields[j] = fields[j].trim();
          if (fields[j] === "") {
            fields[j] = null
          }
        }
        if (!fields[0]) {
          throw new Error("Missing price in WAS");
        }
        if (!fields[2]) {
          throw new Error("Missing title");
        }
        if (!fields[3] || !fields[4]) {
          throw new Error("Missing author");
        }
        if (fields[5] !== "Blanda" && fields[5] !== "Dura") {
          throw new Error("Invalid pasta");
        }
        if (!fields[6]) {
          throw new Error("Missing quantity");
        }

        const inputs = {
          "price": parseFloat(fields[0]),
          "isbn": fields[1],
          "title": fields[2],
          "firstName": fields[3],
          "lastName": fields[4],
          "pasta": fields[5],
          "quantity": parseInt(fields[6])
        }
        validateInputs(inputs);

        const deletedBook = await prismaClient.book.findFirst({
          where: {
            title: fields[2],
            isDeleted: true
          }
        })

        if (deletedBook) {
          await prismaClient.user.delete({
            where: {
              title: fields[2]
            }
          });
        }

        const author = await prismaClient.user.findUnique({
          where: {
            first_name_last_name: {
              first_name: fields[3],
              last_name: fields[4]
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
                title: fields[2],
                pasta: fields[4],
                isbn: fields[1],
                users: {
                  connect: {
                    id: author.id
                  }
                }
              }
            });

            const new_impression = await tx.impression.create({
              data: {
                bookId: addedBook.id,
                quantity: parseInt(fields[6]),
              }
            })

            const new_inventory = await tx.inventory.create({
              data: {
                bookId: addedBook.id,
                bookstoreId: 1,
                country: "México",
                price: parseFloat(fields[0]),
                initial: parseInt(fields[6]),
                current: parseInt(fields[6])
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
            errors.push({"line": i + 1, "error": "Error non identificada - puede ser con la impresión o el inventario"})
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



export async function deleteBook(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }
    validateInputs(inputs);

    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;
    await prismaClient.$transaction(async (tx) => {
      const deletedBook = await tx.book.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBook) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([inputs.id], "books", tx);
        const deletedKindleSales = await softDeleteKindleSalesOnCascade(deletedBook.id, tx);
        const deletedCosts = await softDeleteCostsOnCascade(deletedBook.id, tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
        await softDeleteImpressionsOnCascade(deletedBook.id, tx);
      }

      res.status(200).json({message: "El libro ha sido eliminado con exito."})
    })
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the book'});
  }
}
router.delete('/book/:id', deleteBook);



export async function updateBook(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "title": req.body.title,
      "pasta": req.body.pasta,
      "isbn": req.body.isbn,
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



export async function updateBookPrices(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
    }
    validateInputs(inputs);
    // const prismaClient = prismaTestClient === null ? prisma : prismaTestClient;
    const prismaClient = req.prisma || prisma;

    const bookWithPricesToUpdate = await prismaClient.book.findUnique({where: {id: inputs.id}});
    if (bookWithPricesToUpdate.isDeleted) {
      throw new Error (`this book is deleted`);
    }

    const prices = req.body.prices;
    for (const price of prices) {
      const error = validateInput("price", parseFloat(price.price));
      if (error.length > 0) {
        throw new Error (`invalid input ${error[0]}`)
      }
    }

    await prismaClient.$transaction(async (tx) => {
      for (const price of prices) {
        const updatedInventory = await tx.inventory.update({
          where: {id: parseInt(price.inventoryId)},
          data: {price: parseFloat(price.price)},
        })
      }

      res.status(200).json({message: "Successfully updated the book prices"});
    })
  } catch (error) {
    console.error("Server error at the update book route:", error);
    res.status(500).json({error: "There was an issue updating the prices"});
  }
}
router.patch('/book/:id/prices', updateBookPrices);

// Bookstores routes

export async function getBookstores(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const bookstores = await prismaClient.bookstore.findMany({where: {isDeleted: false}});
    res.status(200).json(bookstores);
  } catch(error) {
    console.error("Error in the get bookstores route:", error);
    res.status(500).json({error: 'A server error occurred while fetching bookstores'});
  }
}
router.get('/bookstore', getBookstores);



export async function getExistingBookstoreNames(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const existingBookstores = await prismaClient.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        inventories: {
          select: {
            bookId: true
          }
        }
      }
    })
    res.status(200).json(existingBookstores);
  } catch (error) {
    console.error("Error in the route existingBookstores:", error);
    res.status(500).json({error: 'A server error occurred while fetching existingBookstores'});
  }
}
router.get('/existingBookstores', getExistingBookstoreNames);



export async function addBookstore(req, res) {
  try {
    const inputs = {
      "name": req.body.name,
      "dealPercentage": parseFloat(req.body.dealPercentage),
      "comissions": req.body.comissions === "true" ? true : false,
      "contactName": req.body.contactName,
      "phone": req.body.contactPhone,
      "email": req.body.contactEmail
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const new_bookstore =  await prismaClient.bookstore.create({
      data: {
        name: inputs.name,
        deal_percentage: inputs.dealPercentage,
        comissions: inputs.comissions,
        contact_name: inputs.contactName,
        contact_phone: inputs.phone,
        contact_email: inputs.email,
      },
    });

    res.status(201).json({name: new_bookstore.name});
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'A server error occured while creating the category'});
  }
}
router.post('/bookstore', addBookstore);



export async function updateBookstore(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
      "name": req.body.name,
      "dealPercentage": parseFloat(req.body.dealPercentage),
      "comissions": req.body.comissions === "true" ? true : false,
      "contactName": req.body.contactName,
      "phone" : req.body.contactPhone,
      "email": req.body.contactEmail
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const existingBookstore = await prismaClient.bookstore.findUnique({where: {id: inputs.id}});
    if (existingBookstore.isDeleted) {throw new Error("this bookstore is deleted")};

    await prismaClient.$transaction(async (tx) => {
      const updatedBookstore = await tx.bookstore.update({
        where: {id: inputs.id},
        data: {
          name: inputs.name,
          comissions: inputs.comissions,
          deal_percentage: inputs.dealPercentage,
          contact_name: inputs.contactName,
          contact_phone: inputs.phone,
          contact_email: inputs.email,
        }
      });

      res.status(200).json({message: "Successfully updated bookstore"});
    })
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
}
router.patch('/bookstore/:id', updateBookstore);



export async function deleteBookstore(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id)
    }

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const deletedBookstore = await tx.bookstore.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        }
      });

      if (deletedBookstore) {
        const deletedInventoriesIds = await softDeleteInventoriesOnCascade([inputs.id], "bookstores", tx);
        await softDeleteSalesOnCascade(deletedInventoriesIds, tx);
      }

      res.status(200).json({message: "La libreria ha sido eliminada con exito."})
    })

  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the bookstore'});
  }
}
router.delete('/bookstore/:id', deleteBookstore);



/// Inventories routes

export async function getInventories(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const inventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        bookId: true,
        book: {
          select: {
            title: true,
            impressions: {
              where: {
                isDeleted: false
              },
              select: {
                id: true,
                quantity: true,
                note: true,
                createdAt: true
              }
            }
          }
        },
        bookstoreId: true,
        bookstore: {
          select: {
            name: true
          }
        },
        country: true,
        price: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          where: {
            isDeleted: false
          },
          select: {
            quantity: true
          }
        }
      },
      orderBy: {
        book: {
          title: 'asc'
        }
      }
    });

    for (const inventory of inventories) {
      let totalSales = 0;
      for (const sale of inventory.sales) {
        totalSales += sale.quantity
      }
      inventory["totalSales"] = totalSales
    }

    res.status(200).json(inventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventories route"});
  }
}
router.get('/inventories', getInventories);



export async function getInventoryNames(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const bookInventoryNames = await prismaClient.book.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true
      }
    });
    
    const bookstoreInventoryNames = await prismaClient.bookstore.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true
      }
    })

    let inventoryNames = [];
    for (const book of bookInventoryNames) {
      const formatted = {
        "name": book.title,
        "type": "book",
        "id": book.id
      }
      inventoryNames.push(formatted)
    }

    for (const bookstore of bookstoreInventoryNames) {
      const formatted = {
        "name": bookstore.name,
        "type": "bookstore",
        "id": bookstore.id
      }
      inventoryNames.push(formatted)
    }

    res.status(200).json(inventoryNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoryNames route"});
  }
}
router.get('/inventoryNames', getInventoryNames);



export async function getInventoriesByBook(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const inventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        book: {
          select: {
            title: true,
            impressions: {
              select: {
                id: true,
                quantity: true,
                isDeleted: true
              }
            }
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true,
          }
        },
        bookstoreId: true,
        price: true,
        country: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        }
      }
    });

    let inventoriesByBook = []
    let extraImpressionsByBook = [];
    for (const inventory of inventories) {
      let sold = 0;

      //Prepping extraImpressions data
      function determineExtraImpressions(extraImpressionsByBook) {
        let extraImpressionsTotal = 0;
        let extraImpressions = inventory.book.impressions.slice(1)
        if (extraImpressions.length > 0) {
          for (const impression of extraImpressions) {
            if (!impression.isDeleted) {
              extraImpressionsTotal += impression.quantity
            }
          }
        }

        extraImpressionsByBook.push({
          "name": inventory.book.title,
          "extraImpressions": extraImpressionsTotal
        })
      }

      if (extraImpressionsByBook.length === 0) {
        determineExtraImpressions(extraImpressionsByBook)
      }

      for (const entry of extraImpressionsByBook) {
        if (entry.name === inventory.book.title) {
          continue;
        }
      } 

      determineExtraImpressions(extraImpressionsByBook);
      
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          sold += sale.quantity
        }
      }

      if (inventoriesByBook.length === 0) {
        inventoriesByBook.push({
          "id": inventory.bookId,
          "type": "book",
          "name": inventory.book.title,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
        continue;
      };

      let existingBook = false
      for (const bookInventory of inventoriesByBook) {
        if (bookInventory.name === inventory.book.title) {
          // bookInventory.initial += inventory.initial
          bookInventory.sold += sold
          bookInventory.current += inventory.current
          bookInventory.returns += inventory.returns
          if (bookInventory.givenToAuthor === 0) {
            bookInventory.givenToAuthor += inventory.givenToAuthor
          }
          existingBook = true
        }
      }

      if (!existingBook) {
        inventoriesByBook.push({
          "id": inventory.bookId,
          "type": "book",
          "name": inventory.book.title,
          "initial": inventory.initial,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      }
    }

    //Adding the extraImpression data for each book 
    for (const impression of extraImpressionsByBook) {
      for (const book of inventoriesByBook) {
        if (impression.name === book.name) {
          book.extraImpressions = impression.extraImpressions
        }
      }
    }

    res.status(200).json(inventoriesByBook);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error fetching inventories route"});
  }
}
router.get('/inventoriesByBook', getInventoriesByBook);

export async function getBookInventory(req, res) {
  try {
    const inputs = {
      'id': parseInt(req.params.id)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma
    const thatBookImpressions = await prismaClient.impression.findMany({
      where: {
        bookId: inputs.id,
        isDeleted: false
      },
      select: {
        id: true,
        quantity: true,
        note: true,
        isDeleted: true,
        createdAt: true,
        date: true
      },
      orderBy: {
        date: "asc"
      }
    })

    const thatBookInventories = await prismaClient.inventory.findMany({
      where: {
        bookId: inputs.id,
        isDeleted: false
      },
      select: {
        id: true,
        bookstore: {
          select: {
            name: true
          }
        },
        bookstoreId: true,
        book: {
          select: {
            title: true
          }
        },
        bookId: true,
        country: true,
        price: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        },
        transfersFrom: {
          select: {
            quantity: true,
            isDeleted: true,
            toInventoryId: true
          }
        },
        transfersTo: {
          select: {
            quantity: true,
            isDeleted: true,
          }
        }
      }
    })

    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    let returnsTotal = 0;
    let givenToAuthorTotal = 0;
    let soldTotal = 0;
    let name = thatBookInventories[0].book.title
    let id = inputs.id;
    for (const inventory of thatBookInventories) {
      let thisInventorySalesTotal = 0
      currentTotal += inventory.current;
      // initialTotal += inventory.initial;
      returnsTotal += inventory.returns;
      givenToAuthorTotal += inventory.givenToAuthor;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          soldTotal += sale.quantity
          thisInventorySalesTotal += sale.quantity
        }
      }

      let inTiendaTotal = 0
      for (const transferFrom of inventory.transfersFrom) {
        if (transferFrom.isDeleted === false && transferFrom.toInventoryId) {
          inTiendaTotal -= transferFrom.quantity
        } 
      }
      for (const transferTo of inventory.transfersTo) {
        if (transferTo.isDeleted === false) {
          inTiendaTotal += transferTo.quantity
        }
      }
      if (inventory.bookstoreId === 1) {
        for (const impression of thatBookImpressions) {
          if (impression.isDeleted === false) {
            inTiendaTotal += impression.quantity
          }
        }
        initialTotal += inventory.initial
        inTiendaTotal -= inventory.returns

      } else {
        inTiendaTotal += inventory.returns
      }

      const inventoryComplete = {
        ...inventory, 
        totalSales: thisInventorySalesTotal, 
        inTienda: inTiendaTotal,
        impressions: thatBookImpressions
      }
      relevantInventories.push(inventoryComplete);
    }
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    const payload = {
      sortedRelevantInventories,
      name,
      id,
      currentTotal,
      initialTotal,
      returnsTotal,
      givenToAuthorTotal,
      soldTotal,
      thatBookImpressions
    }

    res.status(200).json(payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesByBook route"});
  }
}
router.get('/inventoriesByBook/:id', getBookInventory);



export async function getInventoriesByBookstore(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const inventories = await prismaClient.inventory.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        book: {
          select: {
            title: true,
            impressions: {
              select: {
                quantity: true,
                isDeleted: true
              }
            }
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true,
          }
        },
        bookstoreId: true,
        price: true,
        country: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        }
      }
    });

    let inventoriesByBookstore = []
    for (const inventory of inventories) {
      let sold = 0;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          sold += sale.quantity
        }
      }

      if (inventoriesByBookstore.length === 0) {
        //adding extra impressions to initial (copias) in plataforma Was
        let extraImpressions = 0;
        if (inventory.bookstoreId === 1) {
          for (const impression of inventory.book.impressions.slice(1)) {
            if (!impression.isDeleted) {
              extraImpressions += impression.quantity 
            }
          }
        }

        inventoriesByBookstore.push({
          "id": inventory.bookstoreId,
          "type": "bookstore",
          "name": inventory.bookstore.name,
          "initial": inventory.initial + extraImpressions,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      } else {
      let existingBookstore = false
      for (const bookstoreInventory of inventoriesByBookstore) {
        let extraImpressions = 0;
        if (inventory.bookstoreId === 1) {
          for (const impression of inventory.book.impressions.slice(1)) {
            if (!impression.isDeleted) {
              extraImpressions += impression.quantity 
            }
          }
        }

        if (bookstoreInventory.name === inventory.bookstore.name) {
          bookstoreInventory.initial += inventory.initial + extraImpressions
          bookstoreInventory.sold += sold
          bookstoreInventory.current += inventory.current
          bookstoreInventory.returns += inventory.returns
          bookstoreInventory.givenToAuthor += inventory.givenToAuthor
          existingBookstore = true
        }
      }

      if (!existingBookstore) {
        let extraImpressions = 0;
        if (inventory.bookstoreId === 1) {
          for (const impression of inventory.book.impressions.slice(1)) {
            if (!impression.isDeleted) {
              extraImpressions += impression.quantity 
            }
          }
        }

        inventoriesByBookstore.push({
          "id": inventory.bookstoreId,
          "type": "bookstore",
          "name": inventory.bookstore.name,
          "initial": inventory.initial + extraImpressions,
          "sold": sold,
          "current": inventory.current,
          "returns": inventory.returns,
          "givenToAuthor": inventory.givenToAuthor
        })
      }
    }
  }

    res.status(200).json(inventoriesByBookstore);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error fetching inventories route"});
  }
}
router.get('/inventoriesByBookstore', getInventoriesByBookstore);



export async function getBookstoreInventory(req, res) {
  try {
    const inputs = {
      "id": parseInt(req.params.id),
    }

    const prismaClient = req.prisma || prisma
    const thatBookstoreInventories = await prismaClient.inventory.findMany({
      where: {
        bookstoreId: inputs.id,
        isDeleted: false
      },
      select: {
        id: true,
        book: {
          select: {
            title: true,
          }
        },
        bookId: true,
        bookstore: {
          select: {
            name: true
          }
        },
        bookstoreId: true,
        price: true,
        country: true,
        initial: true,
        current: true,
        returns: true,
        givenToAuthor: true,
        sales: {
          select: {
            quantity: true,
            isDeleted: true
          }
        }
      }
    })

    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    let returnsTotal = 0;
    let givenToAuthorTotal = 0;
    let soldTotal = 0;
    let name = thatBookstoreInventories[0].bookstore.name;
    let extraImpressionsTotal = 0;
    let id = inputs.id;
    for (const inventory of thatBookstoreInventories) {
      let thisInventorySalesTotal = 0
      currentTotal += inventory.current;
      initialTotal += inventory.initial;
      returnsTotal += inventory.returns;
      givenToAuthorTotal += inventory.givenToAuthor;
      for (const sale of inventory.sales) {
        if (sale.isDeleted === false) {
          soldTotal += sale.quantity
          thisInventorySalesTotal += sale.quantity
        }
      }

      //Impressions for Plataforma Was inventory
      let extraImpressionsOutside = 0;
      if (inputs.id === 1) {
        const thatBookImpressions = await prismaClient.impression.findMany({
          where: {
            bookId: inventory.bookId,
            isDeleted: false
          },
          select: {
            id: true,
            quantity: true
          },
          orderBy: {
            date: "asc"
          }
        })

        if (thatBookImpressions.length > 1) {
          let extraImpressions = thatBookImpressions.slice(1)
          for (const impression of extraImpressions) {
            extraImpressionsOutside += impression.quantity
            extraImpressionsTotal += impression.quantity
          }
        }
      }
      const inventoryPlusSales = {
        ...inventory, 
        totalSales: thisInventorySalesTotal,
        extraImpressions: extraImpressionsOutside
      }
      relevantInventories.push(inventoryPlusSales);
    }
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    const payload = {
      name,
      id,
      sortedRelevantInventories,
      currentTotal,
      initialTotal,
      returnsTotal,
      givenToAuthorTotal,
      soldTotal,
      extraImpressionsTotal
    }

    res.status(200).json(payload);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesByBook route"});
  }
}
router.get('/inventoriesByBookstore/:id', getBookstoreInventory)



export async function getInventoriesCurrentTotals(req, res) {
  try {
    const prismaClient = req.prisma || prisma
    const currentTotals = await prismaClient.inventory.groupBy({
      by: ['bookstoreId'],
      where: {
        isDeleted: false
      },
      _sum: {
        current: true
      }
    })

    const withNames = await Promise.all(
      currentTotals.map(async (group) => {
        const bookstore = await prismaClient.bookstore.findUnique({
          where: { id: group.bookstoreId },
          select: { name: true }
        });

        return {
          ...group,
          bookstoreName: bookstore?.name || null
        };
      })
    );

    res.status(200).json(withNames);

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at inventoriesCurrentTotals route"});
  }
}
router.get('/inventoriesCurrentTotals', getInventoriesCurrentTotals);



export async function updateInventory(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      bookId: parseInt(req.body.book),
      bookstoreId: parseInt(req.body.bookstore),
      inicial: parseInt(req.body.inicial),
      price: parseFloat(req.body.price)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const currentInventory = await tx.inventory.findUnique({
        where: {id: inputs.id}
      });
      if (currentInventory.isDeleted) {
        throw new Error("this inventory is deleted");
      }

      const difference = inputs.inicial - currentInventory.initial
      let updatedInventory = await tx.inventory.update({
        where: {id: inputs.id},
        data: {
          bookId: inputs.bookId,
          bookstoreId: inputs.bookstoreId,
          initial: inputs.inicial,
          current: currentInventory.current + difference,
          price: inputs.price
        }
      });

      if (updatedInventory) {
        res.status(200).json({message: "Successfully updated inventory"});
      } else {
        if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`)"))) {
          res.status(500).json({message: "Este inventario ya existe"})
          return;
        }
        res.status(500).json({error: "There was an issue updating the bookstore"});
      };
    })
  } catch(error) {
    console.error("Server error at the update bookstore route:", error);
    res.status(500).json({error: "There was an issue updating the bookstore"});
  }
}
router.patch('/inventory/:id', updateInventory);

// export async function deleteInventory(req, res) {
//   const inventory_id = parseInt(req.params.id);

//   try {

//     await prisma.$transaction(async (tx) => {
//       const deletedInventory = await tx.inventory.update({
//         where:{id: inventory_id},
//         data: {isDeleted: true}
//       });

//       if (deletedInventory) {
//         await softDeleteSalesOnCascade([inventory_id], tx);
//       }

//       res.status(200).json({message: "El inventario ha sido eliminado con exito."})
//     })
    
//   } catch(error) {
//     console.error(error);
//     res.status(500).json({error: 'A server error occurred while deleting the inventory'});
//   }
// }
// router.delete('/inventory/:id', deleteInventory);



/// Sales routes

export async function getSales(req, res) {
  try {
    const inputs = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : twelveMonthsAgo(),
      endDate: req.query.endDate ? new Date(req.query.endDate) : new Date()
    };
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const sales = await prismaClient.sale.findMany({
      where: {
        isDeleted: false,
        date: {
          gte: inputs.startDate,
          lt: inputs.endDate
        }
      },
      select: {
        id: true,
        inventoryId: true,
        inventory: {
          select: {
            bookId: true,
            book: {
              select: {
                title: true,
                users: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true
                  }
                }
              }
            },
            bookstoreId: true,
            bookstore: {
              select: {
                name: true,
                deal_percentage: true
              }
            },
            country: true,
            price: true,
            initial: true
          }
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
        date: true
      },
      orderBy: {
        date: "desc"
      }
    });

    sales.map((sale) => {
      sale.completeInventory = sale.inventory.book.title + ", " + sale.inventory.bookstore.name
      sale.createdAt = sale.createdAt.toLocaleString();
      sale.updatedAt = sale.updatedAt.toLocaleString();
      sale.date = sale.date.toLocaleString();
      sale.authorsString = getAuthorString(sale.inventory.book.users);
    })

    const monthsRange = generateMonthKeysForRange(inputs.startDate, inputs.endDate)
    let salesCompiled = [];
    for (const month of monthsRange) {
      salesCompiled.push(
        {
          "forMonth" : month,
          "sales": [],
          "total": 0,
          "bookstores": [],
          "books": [],
          "authors": []
        }
      )
    }
    for (const sale of sales) {
      for (const month of salesCompiled) {
        if (getForMonth(sale.date) === month.forMonth) {
          month.sales.push(sale);
          month.total += sale.quantity

          if (!month.bookstores.includes(sale.inventory.bookstore.name)) {
            month.bookstores.push(sale.inventory.bookstore.name)
          }
          month.bookstores.sort()
          
          if (!month.books.includes(sale.inventory.book.title)) {
            month.books.push(sale.inventory.book.title)
          }
          month.books.sort()
          
          for (const author of sale.inventory.book.users) {
            if (!month.authors.includes( (author.first_name + " " + author.last_name) )) {
              month.authors.push( (author.first_name + " " + author.last_name) )
            }
          }
          month.authors.sort()
        }
      }
    }

    res.status(200).json(salesCompiled);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at sales route"});
  }
} 
router.get('/sales', getSales);



export async function addSale(req, res) {
  try {
    const inputs = {
      "bookId": parseInt(req.body.bookId),
      "bookstoreId": parseInt(req.body.bookstoreId),
      "quantity": parseInt(req.body.quantity),
      "date": new Date(req.body.date)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    let createdSale;
    await prismaClient.$transaction(async (tx) => {
      const selectedInventory = await tx.inventory.findUnique({
        where : {
          bookId_bookstoreId: {
            bookId : inputs.bookId,
            bookstoreId: inputs.bookstoreId,
          }
        },
        include: {
          bookstore: true,
          book: true
        }
      });

      if (!selectedInventory) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo y librería"});
        return;
      }

      if (selectedInventory.current < inputs.quantity) {
        res.status(400).json(
          { message: "El inventario tiene menos libros disponibles que la cantidad entrada."}
        );
        return;
      }

      const bookWithUsers = await tx.book.findUnique({
        where: {
          id: inputs.bookId
        },
        include: {
          users: true
        }
      })

      const authorListIds = bookWithUsers.users.map(user => user.id);
      const saleForMonth = getForMonth(inputs.date);
      let paymentIds = []
      for (const authorId of authorListIds) {
        const existingPayment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: authorId,
              forMonth: saleForMonth
            }
          }
        });

        if (existingPayment && existingPayment.isDeleted) {
          const deletedPayment = await tx.payment.delete({ where: {id: existingPayment.id}})
          const recreatedPayment = await tx.payment.create({
            data: {
              userId: authorId,
              forMonth: saleForMonth
            }
          })
        };

        if (!existingPayment) {
          const createdPayment = await tx.payment.create({
            data: {
              userId: authorId,
              forMonth: saleForMonth,
            }
          });

          paymentIds.push({"id": createdPayment.id})
        }
      }

      createdSale = await tx.sale.create({
        data: {
          inventoryId: selectedInventory.id,
          quantity: inputs.quantity,
          date: inputs.date,
          payments: {
            connect: paymentIds
          }
        },
        include: {
          payments: true
        }
      })

      if (createdSale) {
        const updatedInventory = await tx.inventory.update({
          where: {id: selectedInventory.id},
          data: {
            current: selectedInventory.current - inputs.quantity
          }
        });
      }
    })
    
    res.status(201).json(createdSale);
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
}
router.post('/sale', addSale)



export async function updateSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      bookId: parseInt(req.body.book),
      bookstoreId: parseInt(req.body.bookstore),
      quantity: parseInt(req.body.quantity),
      date: new Date(req.body.date)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma
    // console.log("db", process.env.DATABASE_URL)

    await prismaClient.$transaction(async (tx) => {
      const selectedInventory = await tx.inventory.findUnique({where : {
        bookId_bookstoreId: {
          bookId : inputs.bookId,
          bookstoreId: inputs.bookstoreId,
        }}});

      if (!selectedInventory || selectedInventory.isDeleted) {
        res.status(400).json({ message: "No existe un inventario con esta combinación de titulo y librería"});
        return;
      }

      const previousSale = await tx.sale.findUnique({
        where: {
          id: inputs.id
        },
        include: {
          inventory: {
            include: {
              book: {
                include: {
                  users: true
                }
              },
              bookstore: true
            }
          },
          payments: true
        }
      });

      if (previousSale.isDeleted) {
        res.status(400).json({message: "Esta venta ha sido eliminada"})
        return;
      }

      let previousSalePayments = []
      for (const payment of previousSale.payments) {
        previousSalePayments.push({"id": payment.id})
      }

      let quantityUpdate = previousSale.quantity - inputs.quantity;

      if ((selectedInventory.current + quantityUpdate) < 0) {
        res.status(400).json({ message: "El inventario tiene menos libros que la cantidad entrada."});
        return;
      }

      let recipientPayments = []
      if (getForMonth(inputs.date) !== getForMonth(previousSale.date)) {
        for (const user of previousSale.inventory.book.users) {
          const existingPayment = await prismaClient.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: user.id,
                forMonth: getForMonth(inputs.date)
              }
            }
          })

          if (!existingPayment) {
            const createdPayment = await prismaClient.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(inputs.date)
              }
            })
            recipientPayments.push({"id": createdPayment.id})
            continue;
          }

          if (existingPayment && existingPayment.isDeleted) {
            const deletedPayment = await prismaClient.payment.delete({where: {id: existingPayment.id}})
            const recreatedPayment = await prismaClient.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(inputs.date)
              }
            });
            recipientPayments.push({"id": recreatedPayment.id});
            continue;
          }

          if (existingPayment && !existingPayment.isDeleted && existingPayment.status === "created") {
            recipientPayments.push({"id": existingPayment.id});
            continue;
          }

          if (existingPayment 
            && !existingPayment.isDeleted
            && (existingPayment.status === "paid" || existingPayment.status === "solicited")) {

            let currentForMonthDate = new Date(existingPayment.forMonth + "-01")
            let nextPaymentDate = new Date(currentForMonthDate)
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)

            let nextPayment = await prismaClient.payment.findUnique({where: {
              userId_forMonth: {
                userId: user.id,
                forMonth: getForMonth(nextPaymentDate)
              }
            }})

            let paymentEncountered = false;
            while(nextPayment) {
              if (nextPayment.isDeleted 
              || nextPayment.status === "solicited"
              || nextPayment.status === "paid") {
                nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)
                nextPayment = await prismaClient.payment.findUnique({where: {
                  userId_forMonth: {
                    userId: user.id,
                    forMonth: getForMonth(nextPaymentDate)
                  }
                }})
                continue;

              } else {
                paymentEncountered = true;
                recipientPayments.push({"id": nextPayment.id})
                break;
              }
            }

            if (!paymentEncountered) {
              const newPayment = await prismaClient.payment.create({
                data: {
                  userId: user.id,
                  forMonth: getForMonth(nextPaymentDate)
                }
              })

              recipientPayments.push({"id": newPayment.id});
              continue;
            }
          }
        };          
      }

      const updatedSale = await tx.sale.update({
        where: {id: inputs.id},
        data: {
          inventoryId: selectedInventory.id,
          quantity: inputs.quantity,
          date: new Date(inputs.date), 
          payments: {
            set: recipientPayments.length > 0 ? recipientPayments : previousSalePayments
          }
        },
        include: {
          inventory: {
            include: {
              book: {
                include: {
                  users: true
                }
              },
              bookstore: true
            }
          },
          payments: true
        }
      });

      if (updatedSale) {
        const updatedInventory = await tx.inventory.update({
          where: {id: selectedInventory.id},
          data: {
            current: (selectedInventory.current + previousSale.quantity) - inputs.quantity
          }
        });

        res.status(200).json({message: "Successfully updated sale"});
      } else {
        if (String(error).includes(("Unique constraint failed on the fields: (`bookId`,`bookstoreId`)"))) {
          res.status(500).json({message: "Este inventario ya existe"})
          return;
        }
        res.status(500).json({error: "There was an issue updating the sale"});
      };
    })

  } catch(error) {
    console.error("Server error at the update sale route:", error);
    res.status(500).json({error: "There was an issue updating the sale"});
  }
}
router.patch('/sale/:id', updateSale);




export async function deleteSale(req, res) {
  // const sale_id = parseInt(req.params.id);
  // const inventory_id = parseInt(req.query.inventory_id);
  // const quantity = parseInt(req.query.quantity);
  try {
    const inputs = {
      id: parseInt(req.params.id),
      inventoryId: parseInt(req.query.inventory_id),
      // quantity: parseInt(req.query.quantity)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) =>  {
      const deletedSale = await tx.sale.update({where:
        {id: inputs.id},
        data: {
          isDeleted: true
        },
        include: {
          inventory: {
            include: {
              bookstore: true
            }
          }
        }
      });

      if (deletedSale) {
        const selectedInventory = await tx.inventory.findUnique({where: {id: inputs.inventoryId}});
        const updatedInventory = await tx.inventory.update({
          where: {id: inputs.inventoryId},
          data: {
            current: selectedInventory.current + deletedSale.quantity
          }
        });
      }
    })
    
    res.status(200).json({message: "La venta ha sido eliminada con exito."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: 'A server error occurred while deleting the sale'});
  }
}
router.delete('/sale/:id', deleteSale)



/// Impression routes
export async function addImpression(req, res) {
  try {
    const inputs = {
      quantity: parseInt(req.body.quantity),
      id: parseInt(req.body.id),
      note: req.body.note,
      date: new Date(req.body.date)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const createdImpression = await tx.impression.create({
        data: {
          bookId: inputs.id,
          quantity: inputs.quantity,
          note: inputs.note,
          date: inputs.date
        }
      })

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: inputs.id,
            bookstoreId: 1,
          }
        }
      });

      if (!wasInventory) {
        res.status(400).json({message: "Este libro no existe en la bodega Was"})
        return;
      }

      if (!wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current + inputs.quantity,
            // initial: wasInventory.initial + quantity
          }
        })
      };
      res.status(201).json(createdImpression);
    })

  } catch (error) {
    console.error("\n ERROR CREATING THE IMPRESSION: \n", error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.post('/impression', addImpression)



export async function deleteImpression(req, res) {
  try {
    // const impression_id = parseInt(req.params.id);
    // const book_id = parseInt(req.query.book_id);
    // const quantity = parseInt(req.query.quantity);
    const inputs = {
      id: parseInt(req.params.id)
    }
    validateInputs(inputs);
    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const updatedImpression = await tx.impression.update({
        where: {id: inputs.id},
        data: {
          isDeleted: true
        }
      })

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: updatedImpression.bookId,
            bookstoreId: 1
          }
        }
      });

      if (wasInventory && !wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current - updatedImpression.quantity,
            // initial: wasInventory.initial - updatedImpression.quantity
          }
        })
      }

    res.status(200).json(updatedImpression);
    })
  } catch (error) {
    console.error('\n ERROR WHILE DELETING THE IMPRESSION: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.delete('/impression/:id', deleteImpression);



export async function updateImpression(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      quantity: parseInt(req.body.quantity),
      bookId: parseInt(req.body.book_id),
      note: req.body.note, 
      date: new Date(req.body.date),
    }

    const prismaClient = req.prisma || prisma

    await prismaClient.$transaction(async (tx) => {
      const currentImpression = await tx.impression.findUnique({ where: {id: inputs.id}});
      const diff = inputs.quantity - currentImpression.quantity;

      const updatedImpression = await tx.impression.update({
        where: {id: inputs.id},
        data: {
          quantity: inputs.quantity,
          date: inputs.date,
          note: inputs.note
        }
      });

      const wasInventory = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: inputs.bookId,
            bookstoreId: 1
          }
        }
      });

      if (wasInventory && !wasInventory.isDeleted) {
        const updatedInventory = await tx.inventory.update({
          where: {id: wasInventory.id},
          data: {
            current: wasInventory.current + diff,
            initial: wasInventory.initial + diff
          }
        })
      }

      res.status(200).json(updatedImpression);
    })
    
  } catch(error) {
    console.error('\n ERROR WHILE UPDATING THE IMPRESSI0N: \n', error);
    res.status(500).json({error: "A server error occurred while creating the impression"});
  }
}
router.patch('/impression/:id', updateImpression);

/// Transfer route

export async function addTransfer(req, res) {
  try {
    const inputs = {
      // bookstoreTo: req.body.bookstoreTo,
      bookstoreToId: req.body.bookstoreToId ? parseInt(req.body.bookstoreToId) : null,
      // bookstoreFromId: parseInt(req.body.bookstoreFromId),
      quantity: parseInt(req.body.quantity),
      inventoryFromId: parseInt(req.body.inventoryFromId),
      // bookId: parseInt(req.body.bookId),
      type: req.body.type,
      note: req.body.note || null,
      deliveryDate: req.body.deliveryDate ? new Date(req.body.deliveryDate) : null,
      place: req.body.place || null,
      person: req.body.person || null
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    // Start by getting the inventoryFrom
    await prismaClient.$transaction(async (tx) => {
      const currentInventoryFrom = await tx.inventory.findUnique({
        where: {
          id: inputs.inventoryFromId,
        }
      });

      if (currentInventoryFrom.isDeleted) {
        throw new Error("deleted inventory from")
      }

      // Route 1 : delivered to Author
      if (inputs.type === "send" && !inputs.bookstoreToId) {
        const inventoryFrom = await tx.inventory.findUnique({where: {id: inputs.inventoryFromId}})
        if (inventoryFrom.bookstoreId !== 1) {
          return res.status(400).json({message: "Entregas a autores solo se pueden hacer desde el inventario de la bodega Was"})
        }

        const newTransferToAuthor = await tx.transfer.create({
          data: {
            fromInventoryId: inputs.inventoryFromId,
            quantity: inputs.quantity,
            note: inputs.note,
            deliveryDate: inputs.deliveryDate,
            place: inputs.place,
            person: inputs.person
          }
        });

        if(newTransferToAuthor) {
          const updatedFromInventory = await tx.inventory.update({
            where: {id: currentInventoryFrom.id},
            data: {
              givenToAuthor: currentInventoryFrom.givenToAuthor + inputs.quantity,
              current: currentInventoryFrom.current - inputs.quantity
            }
          });
        };

        res.status(200).json(newTransferToAuthor);
        return;
      }

      // Route 2: Return and Send
      // Get the inventoryTo if it exists
      let currentInventoryTo = await tx.inventory.findUnique({
        where: {
          bookId_bookstoreId: {
            bookId: currentInventoryFrom.bookId,
            bookstoreId: inputs.bookstoreToId
          },
        }
      });
      
      if (inputs.type === "return" && (!currentInventoryTo || currentInventoryTo.isDeleted)) {
        throw new Error("arrival inventory doesn't exist");
      }

      //if it doesn't exist create it
      let created;
      if (!currentInventoryTo) {
        const newInventoryTo = await tx.inventory.create({
          data: {
            bookId: currentInventoryFrom.bookId,
            bookstoreId: inputs.bookstoreToId,
            initial: inputs.quantity,
            current: inputs.quantity
          }
        });

        currentInventoryTo = newInventoryTo
        created = true;
      }

      // if it's soft deleted recover it
      if (currentInventoryTo && currentInventoryTo.isDeleted) {
        const recoveredInventoryTo = await tx.inventory.update({
          where: {id: currentInventoryTo.id},
          data: {
            isDeleted: false,
            current: inputs.quantity,
            initial: inputs.quantity
          }
        });

        currentInventoryTo = recoveredInventoryTo;
        created = true;
      } 

      // 5-Create the actual transfer now that you got the proper inventory To and From
      const newTransfer = await tx.transfer.create({
        data: {
          fromInventoryId: inputs.inventoryFromId,
          toInventoryId: parseInt(currentInventoryTo.id),
          quantity: inputs.quantity,
          type: inputs.type
        }
      });

      // If it's a send - update both From and To inventories
      if (newTransfer.type === "send") {
        const updatedInventoryFrom = await tx.inventory.update({
          where: {id: inputs.inventoryFromId},
          data: {
            current: currentInventoryFrom.current - inputs.quantity,
          }
        });
        // update inventoryTo if you ddn't just created or recovered it (they would already be updated)
        if (!created) {
          const updatedInventoryTo = await tx.inventory.update({
            where: {id: currentInventoryTo.id},
            data: {
              current: currentInventoryTo.current + inputs.quantity,
            }
          });
        }
      // If it's a return - same process
      } else {
        const updatedInventoryFrom = await tx.inventory.update({
          where: {id: inputs.inventoryFromId},
          data: {
            current: currentInventoryFrom.current - inputs.quantity,
            returns: currentInventoryFrom.returns + inputs.quantity,
          }
        });

        if (!created) {
          const updatedInventoryTo = await tx.inventory.update({
            where: {id: currentInventoryTo.id},
            data: {
              current: currentInventoryTo.current + inputs.quantity,
              returns: currentInventoryTo.returns + inputs.quantity,
            }
          });
        }
      }
      
    res.status(200).json(newTransfer)
    })
    
  } catch (error) {
    console.error("\n ERROR WHILE CREATING TRANSFER \n", error);
    res.status(500).json({error: "a server error occurred while creating the transfer"})
  }
} 
router.post('/transfer', addTransfer);


/// Payments routes
export async function getPayments(req, res) {
  try {
    const inputs = {
      status: req.query.status
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const selectedPayments = await prismaClient.payment.findMany({
      where: {
        isDeleted: false,
        status: inputs.status
      },
      select: {
        id: true,
        userId: true,
        dateMarkedAsPaid: true,
        status: true,
        isDeleted: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            id: true
          }
        },
        forMonth: true,
        sales: {
          select: {
            id: true,
            quantity: true,
            isDeleted: true,
            inventory: {
              select: {
                id: true,
                price: true,
                bookstore: {
                  select: {
                    id: true,
                    comissions: true,
                    deal_percentage: true
                  }
                }
              }
            }
          }
        },
        kindleSales: {
          select: {
            id: true,
            regalias: true,
            isDeleted: true
          }
        },
        costs: {
          select: {
            id: true,
            amount: true,
            isDeleted: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    async function updateAmount(payment) {
      payment.amount = 0;

      const userWithCategory = await prismaClient.user.findUnique({
        where: {
          id : payment.userId
        },
        include: {
          category: true
        }
      })

      async function updateSales(payment) {
        if (payment.sales.length > 0) {
          for (const sale of payment.sales) {
            if (sale.isDeleted === false) {
              payment.amount += calculateAuthorRevenue(
                sale.inventory.bookstore.comissions,
                sale.inventory.price,
                userWithCategory.category.management_min,
                sale.inventory.bookstore.deal_percentage,
                sale.quantity
              )
            }
          }
        };
      }

      async function updateKindleSales(payment) {
        if (payment.kindleSales.length > 0) {
          for (const kindleSale of payment.kindleSales) {
            if (kindleSale.isDeleted === false) {
              payment.amount += kindleSale.regalias
            }
          }
        }
      }

      async function updateCosts(payment) {
        if (payment.costs.length > 0) {
          for (const cost of payment.costs) {
            if (cost.isDeleted === false) {
              payment.amount -= cost.amount
            }
          }
        }
      }
      
      await Promise.all([
        updateSales(payment),
        updateKindleSales(payment),
        updateCosts(payment)
      ])
    }

    const promises = selectedPayments.map(payment => updateAmount(payment));
    const results = await Promise.all(promises)

    res.status(200).json(selectedPayments);

  } catch (error) {
    console.error("\n ERROR FETCHING PAYMENTS \n", error);
    res.status(500).json({error: "a server error occurred while fetching payments"})
  }
}
router.get('/payments', getPayments);


export async function markPaymentAsPaid(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma

    const now = new Date()
    const paymentToUpdate = await prismaClient.payment.findUnique({where: {id: inputs.id}})
    if (paymentToUpdate && paymentToUpdate.isDeleted) {throw new Error("deleted payment")};
    if (paymentToUpdate && paymentToUpdate.status === "created") {throw new Error("not solicited yet")};
    if (paymentToUpdate && paymentToUpdate.status === "paid") {throw new Error("already paid")};

    const updatedPayment = await prismaClient.payment.update({
      where: {
        id: inputs.id
      },
      data: {
        status: 'paid',
        dateMarkedAsPaid: now
      }
    })
    
    res.status(200).json({message: "Successfully marked payment as paid"})
  } catch(error) {
    console.error("\n ERROR MARKING PAYMENT AS PAID \n", error);
    res.status(500).json({error:"a server error occurred while updating payments"})
  }
}
router.patch('/markAsPaid/:id', markPaymentAsPaid);



/// Costs routes

export async function getCurrentCosts(req, res) {
  try {
    const prismaClient = req.prisma || prisma;

    const currentCosts = await prismaClient.cost.findMany({
      where: {
        isDeleted: false,
        payment: {
          status: "created",
          isDeleted: false
        }
      },
      select: {
        id: true,
        paymentId: true,
        note: true,
        amount: true,
        payment: {
          select: {
            forMonth: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        book: {
          select: {
            title: true
          }
        },
        bookId: true
      }
    })

    if (currentCosts) {
      res.status(200).json(currentCosts);
    }
  } catch(error) {
    console.error("\n ERROR getting current costs from server \n", error);
    res.status(500).json({error:"a server error occurred while fetching payments"})
  }
}
router.get('/currentCosts', getCurrentCosts)



export async function addCost(req, res) {
  try {
    const inputs = {
      "paymentId": req.body.paymentId ? parseInt(req.body.paymentId) : null,
      "amount": parseFloat(req.body.amount),
      "note": req.body.note,
      "bookId": parseInt(req.body.bookId),
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
    // Make sure we got payment Id or Ids
      let paymentIds = [];
      if (!inputs.paymentId) {
        const selectedBook = await tx.book.findFirst({
          where: {
            id: inputs.bookId,
            isDeleted: false
          },
          select: {
            users: {
              select: {
                id: true
              }
            }
          }
        })

        for (const user of selectedBook.users) {
          let userPayment = await tx.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: user.id,
                forMonth: getForMonth(new Date())
              },
            }
          })

          if (!userPayment) {
            const newPayment = await tx.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(new Date())
              }
            })
            paymentIds.push(newPayment.id)
            continue;
          }

          if (userPayment.status !== 'created') {
            const newPaymentNextMonth = await tx.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(new Date(new Date().setMonth(new Date().getMonth() + 1)))
              }
            })
            paymentIds.push(newPaymentNextMonth.id)
            continue;
          }

          if (userPayment.isDeleted) {
            const deletedPayment = await tx.payment.delete({
              where: {
                id: userPayment.id
              }
            })

            const resetPayment = await tx.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(new Date())
              }
            })
            paymentIds.push(resetPayment.id)
          }

          if (!userPayment.isDeleted && userPayment.status === "created") {
            paymentIds.push(userPayment.id);
            continue;
          }
        }
      } else {
        paymentIds.push(inputs.paymentId);
      }

      // get a new cost for each paymentId
      for (const paymentId of paymentIds) {
        const createdCost = await tx.cost.create({
          data: {
            paymentId: paymentId,
            amount: inputs.amount,
            bookId: inputs.bookId,
            note: inputs.note
          }
        });
      }

      res.status(201).json({message: "Cost created successfully"});
    })
    
  } catch (error) {
    console.error("\n ERROR CREATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while creating the cost"})
  }
}
router.post('/cost', addCost)



export async function updateCost(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      amount: parseFloat(req.body.amount),
      note: req.body.note,
      bookId: parseInt(req.body.bookId)
    }
    validateInputs(inputs);

    const prismaClient = req.prisma || prisma;

    const cost = await prismaClient.cost.findUnique({where: {id: inputs.id}})
    if (cost.isDeleted) { throw new Error ("deleted cost") }

    await prismaClient.$transaction(async (tx) => {
      const updatedCost = await tx.cost.update({
        where: {
          id: inputs.id
        },
        data: {
          amount: inputs.amount,
          note: inputs.note,
          bookId: inputs.bookId
        }
      })
    })

    res.status(200).json({message: "The cost was updated successfully"});
  } catch (error) {
    console.error("\n ERROR UPDATING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while updating the cost"})
  }
}
router.patch("/cost/:id", updateCost) 



export async function deleteCost(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id)
    }

    const prismaClient = req.prisma || prisma;

    await prismaClient.$transaction(async (tx) => {
      const markedAsDeletedCost = await tx.cost.update({
        where: {
          id: inputs.id
        },
        data: {
          isDeleted: true
        }
      });
    })

    res.status(200).json({message: "The cost was deleted successfully"});
  } catch (error) {
    console.error("\n ERROR DELETING THE ADDITIONAL COST \n", error);
    res.status(500).json({error:"a server error occurred while deleting the cost"})
  }
}
router.delete('/cost/:id', deleteCost)


/// KINDLE SALES ROUTES

export async function getKindleSales(req, res) {
  try {
    // let startDate = new Date(JSON.parse(req.query.startDate))
    // let endDate = new Date(JSON.parse(req.query.endDate))
    const inputs = {
      startDate: new Date(req.query.startDate),
      endDate: new Date(req.query.endDate)
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    inputs.startDate.setUTCHours(0, 0, 0, 0);
    inputs.endDate.setUTCHours(23, 59, 59, 999);

    const kindleSales = await prismaClient.kindleSale.findMany({
      where: {
        isDeleted: false,
        datePay: {
          gte: inputs.startDate,
          lt: inputs.endDate
        }
      },
      select: {
        id: true,
        bookId: true,
        book: {
          select: {
            title: true,
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        quantityEbook: true,
        quantityPod: true,
        dateCut: true,
        datePay: true,
        regalias: true,
      },
      orderBy: {
        datePay: "desc"
      }
    });

    kindleSales.map((kindleSale) => {
      kindleSale.dateCut = kindleSale.dateCut.toLocaleString();
      kindleSale.datePay = kindleSale.datePay.toLocaleString();
      kindleSale.authorsString = getAuthorString(kindleSale.book.users);
    })

    const monthsRange = generateMonthKeysForRange(inputs.startDate, inputs.endDate)
    let kindleSalesCompiled = [];
    for (const month of monthsRange) {
      kindleSalesCompiled.push(
        {
          "forMonth" : month,
          "sales": [],
          "books": [],
          "authors": []
        }
      )
    }
    for (const kindleSale of kindleSales) {
      for (const month of kindleSalesCompiled) {
        if (getForMonth(kindleSale.datePay) === month.forMonth) {
          month.sales.push(kindleSale);
          
          if (!month.books.includes(kindleSale.book.title)) {
            month.books.push(kindleSale.book.title)
          }
          month.books.sort()
          
          for (const author of kindleSale.book.users) {
            if (!month.authors.includes( (author.first_name + " " + author.last_name) )) {
              month.authors.push( (author.first_name + " " + author.last_name) )
            }
          }
          month.authors.sort()
        }
      }
    }

    res.status(200).json(kindleSalesCompiled);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error at sales route"});
  }
}
router.get('/kindlesales', getKindleSales);



export async function addKindleSale (req, res) {
  try {
    console.log("datePay before transform", req.body.datePay)
    const inputs = {
      "bookId": parseInt(req.body.book),
      "quantityEbook": parseInt(req.body.quantityEbook),
      "quantityPod": parseInt(req.body.quantityPod),
      "dateCut": new Date(req.body.dateCut),
      "datePay": new Date(req.body.datePay),
      "regalias": parseFloat(req.body.regalias),
    }
    validateInputs(inputs);
    if (inputs.dateCut >= inputs.datePay) {
      throw new Error("dateCut later than datePay");
    }
    if ((inputs.quantityEbook + inputs.quantityPod) <= 0) {
      throw new Error("quantityEbook or quantityPod has to be positive");
    }

    const prismaClient = req.prisma || prisma

    const createdKindleSaleTransaction = await prismaClient.$transaction(async (tx) => {
      const bookSold = await tx.book.findUnique({
        where: {
          id: inputs.bookId
        },
        include: {
          users: true
        }
      })

      let authorIds = [];
      for (const user of bookSold.users) {
        authorIds.push(user.id)
      }

      let paymentIds = [];
      for (const author of authorIds) {
        const payment = await tx.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: author,
              forMonth: getForMonth(inputs.datePay)
            }
          }
        })

        if (payment) {
          paymentIds.push({"id": payment.id})
        } else {
          const createdPayment = await tx.payment.create({
            data: {
              userId: author,
              forMonth: getForMonth(inputs.datePay)
            }
          })
          paymentIds.push({"id": createdPayment.id})
        }
      }

      const createdKindleSale = await tx.kindleSale.create({
        data: {
          bookId: inputs.bookId,
          payments: {
            connect: paymentIds
          },
          quantityEbook: inputs.quantityEbook,
          quantityPod: inputs.quantityPod,
          dateCut: inputs.dateCut,
          datePay: inputs.datePay,
          regalias: inputs.regalias
        }
      });

      return createdKindleSale
    });
    
    res.status(200).json({message: "kindleSale created successfully"})
  } catch(error) {
    console.error("Server error at kindlesales ", error);
    res.status(500).json({error: "Server error while updating the kindle sale"})
  }
}
router.post("/kindlesales", addKindleSale);



export async function updateKindleSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id),
      quantityEbook: parseInt(req.body.quantityEbook),
      quantityPod: parseInt(req.body.quantityPod),
      dateCut: new Date(req.body.dateCut),
      datePay: new Date(req.body.datePay),
      regalias: parseFloat(req.body.regalias)
    }
    validateInputs(inputs)
    if (inputs.dateCut >= inputs.datePay) {
      throw new Error("dateCut later than datePay");
    }
    if ((inputs.quantityEbook + inputs.quantityPod) <= 0) {
      throw new Error("quantityEbook or quantityPod has to be positive");
    }

    const prismaClient = req.prisma || prisma

    const targetSale = await prismaClient.kindleSale.findUnique({
      where: {
        id: inputs.id
      }, 
      include: {
        book: {
          include: {
            users: true
          }
        },
        payments: true
      }
    })
    if (targetSale.isDeleted) { throw new Error ("deleted kindle sale") }

    let previousSalePayments = []
    for (const payment of targetSale.payments) {
      previousSalePayments.push({"id": payment.id})
    }

    let recipientPayments = []
    if (getForMonth(inputs.datePay) !== getForMonth(targetSale.datePay)) {
      for (const user of targetSale.book.users) {
        const existingPayment = await prismaClient.payment.findUnique({
          where: {
            userId_forMonth: {
              userId: user.id,
              forMonth: getForMonth(inputs.datePay)
            }
          }
        })

        if (!existingPayment) {
          const createdPayment = await prismaClient.payment.create({
            data: {
              userId: user.id,
              forMonth: getForMonth(inputs.datePay)
            }
          })

          recipientPayments.push({"id": createdPayment.id})
          continue;
        }

        if (existingPayment && existingPayment.isDeleted) {
          const deletedPayment = await prismaClient.payment.delete({where: {id: existingPayment.id}})
          const recreatedPayment = await prismaClient.payment.create({
            data: {
              userId: user.id,
              forMonth: getForMonth(inputs.datePay)
            }
          });
          recipientPayments.push({"id": recreatedPayment.id});
          continue;
        }

        if (existingPayment && !existingPayment.isDeleted && existingPayment.status === "created") {
          recipientPayments.push({"id": existingPayment.id});
          continue;
        }

        if (existingPayment 
        && !existingPayment.isDeleted
        && (existingPayment.status === "paid" || existingPayment.status === "solicited")) {
          let currentForMonthDate = new Date(existingPayment.forMonth + "-01")
          let nextPaymentDate = new Date(currentForMonthDate)
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)

          let nextPayment = await prismaClient.payment.findUnique({where: {
            userId_forMonth: {
              userId: user.id,
              forMonth: getForMonth(nextPaymentDate)
            }
          }})

          let paymentEncountered = false;
          while(nextPayment) {
            if (nextPayment.isDeleted 
            || nextPayment.status === "solicited"
            || nextPayment.status === "paid") {
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() +1)
              nextPayment = await prismaClient.payment.findUnique({where: {
                userId_forMonth: {
                  userId: user.id,
                  forMonth: getForMonth(nextPaymentDate)
                }
              }})
              continue;

            } else {
              paymentEncountered = true;
              recipientPayments.push({"id": nextPayment.id})
              break;
            }
          }

          if (!paymentEncountered) {
            const newPayment = await prismaClient.payment.create({
              data: {
                userId: user.id,
                forMonth: getForMonth(nextPaymentDate)
              }
            })

            recipientPayments.push({"id": newPayment.id});
            continue;
          }
        }
      };          
    } 

    const updatedKindleSale = await prismaClient.kindleSale.update({
      where: {
        id: inputs.id
      },
      data: {
        quantityEbook: inputs.quantityEbook,
        quantityPod: inputs.quantityPod,
        dateCut: inputs.dateCut,
        datePay: inputs.datePay,
        regalias: inputs.regalias,
        payments: {
          set: recipientPayments.length > 0 ? recipientPayments : previousSalePayments 
        }
      }
    })

    res.status(200).json({message: "updated kindle sale successfully"})
  } catch(error) {
    console.error("Server error at updating kindlesales ", error);
    res.status(500).json({error: "Server error while updating the kindle sale"})
  }
}
router.patch("/kindlesales/:id", updateKindleSale)



export async function deleteKindleSale(req, res) {
  try {
    const inputs = {
      id: parseInt(req.params.id)
    }
    validateInputs(inputs)

    const prismaClient = req.prisma || prisma

    const deletedKindleSale = await prismaClient.kindleSale.update({
      where: {
        id: inputs.id
      },
      data: {
        isDeleted: true
      }
    })
    
    res.status(200).json({message: "successfully deleted the kindle sale"})
  } catch(error) {
    console.error("error at deleting kindlesales ", error);
    res.status(500).json({error: "Server error while deleting the kindle sale"})
  }
}
router.delete("/kindlesales/:id", deleteKindleSale)



/// soft delete on cascade

export async function softDeleteBooksOnCascade(deletedAuthor, tx) {
  const booksToDelete = await tx.book.findMany({
    where: {
      users: {
        some: {
          id: deletedAuthor.id
        }
      },
      isDeleted: false
    },
    include: {
      users: true
    }
  });

  let deletedBooksIds = [];
  for (const book of booksToDelete) {
    if (book.users.length > 1) {
      let validAuthorFound = false;
      for (const user of book.users) {
        if (!user.isDeleted) {
          validAuthorFound = true
          break;
        }
      }

      if (validAuthorFound) {continue};

      const deletedBook = await tx.book.update({
        where: {id: book.id},
        data: {isDeleted: true}
      })
      deletedBooksIds.push(deletedBook.id);
    } else {
      const deletedBook = await tx.book.update({
        where: {id: book.id},
        data: {isDeleted: true}
      })
      deletedBooksIds.push(deletedBook.id);
    };
  };

  return deletedBooksIds;
}

export async function softDeletePaymentsOnCascade(deletedAuthor, tx) {
  const paymentsToDelete = await tx.payment.findMany({
    where: {
      userId: deletedAuthor.id,
      isDeleted: false
    }
  })

  let deletedPaymentsIds=[];
  for (const payment of paymentsToDelete) {
    const deletedPayment = await tx.payment.update({
      where: {
        id: payment.id
      },
      data: {
        isDeleted: true
      }
    })
    deletedPaymentsIds.push(deletedPayment.id)
  }

  return deletedPaymentsIds;
}

export async function softDeleteInventoriesOnCascade(IdsList, cascadeType, tx) {
  let filter = '';
  if (cascadeType === "books") {
    filter = "bookId"
  } else if (cascadeType === "bookstores") {
    filter = "bookstoreId"
  } else {
    console.error("There was an error soft deleting inventories on cascade");
    return;
  }

  let inventoriesToDelete = [];
  for (const id of IdsList) {
    const relatedInventories = await tx.inventory.findMany({
      where: {[filter]: id}
    });
    for (const inventory of relatedInventories) {
      inventoriesToDelete.push(inventory.id);
    };
  };

  let deletedInventoriesIds = [];
  for (const inventoryId of inventoriesToDelete) {
    const deletedInventory =  await tx.inventory.update({
      where: {id: inventoryId},
      data: {isDeleted: true},
    });
    deletedInventoriesIds.push(deletedInventory.id);
  };
  return deletedInventoriesIds;
}

export async function softDeleteImpressionsOnCascade(deletedBookId, tx) {
  const impressionsToDelete = await tx.impression.findMany({
    where: {
      bookId: deletedBookId,
      isDeleted: false
    },
  });

  let deletedImpressionsIds = [];
  for (const impression of impressionsToDelete) {
    const deletedImpression = await tx.impression.update({
      where : {id: impression.id},
      data: {isDeleted: true}
    })
    deletedImpressionsIds.push(deletedImpression.id)
  };
  return deletedImpressionsIds;
}

export async function softDeleteSalesOnCascade(IdsList, tx) {
  let salesToDelete = [];

  for (const id of IdsList) {
    const relatedSales = await tx.sale.findMany({
      where: {inventoryId: id},
      select: {
        id : true,
        quantity: true,
        createdAt: true,
        inventoryId: true,
        inventory: {
          select: {
            bookId: true,
            price: true,
            bookstore: {
              select: {
                comissions: true
              }
            }
          }
        }
      }
    });
    for (const sale of relatedSales) {
      salesToDelete.push(sale);
    }
  }

  await Promise.all(
    salesToDelete.map(async (sale) => {
      await tx.sale.update({
        where: {id: sale.id},
        data: { isDeleted: true}
      })
    })
  );
}

export async function softDeleteKindleSalesOnCascade(deletedBookId, tx) {
  const kindleSalesToDelete = await tx.kindleSale.findMany({
    where: {
      bookId: deletedBookId,
      isDeleted: false
    }
  })

  let deletedKindleSaleIds = [];
  for (const kindleSale of kindleSalesToDelete) {
    const deletedKindleSale = await tx.kindleSale.update({
      where: {
        id: kindleSale.id
      },
      data: {
        isDeleted: true
      }
    })
    deletedKindleSaleIds.push(deletedKindleSale.id)
  }

  return deletedKindleSaleIds;
}

export async function softDeleteCostsOnCascade(deletedBookId, tx) {
  const costsToDelete = await tx.cost.findMany({
    where: {
      bookId: deletedBookId,
      isDeleted: false
    }
  });

  let deletedCostsIds = [];
  for (const cost of costsToDelete) {
    const deletedCost = await tx.cost.update({
      where: {id: cost.id},
      data: {isDeleted: true}
    });
    deletedCostsIds.push(deletedCost.id)
  };

  return deletedCostsIds;
}

export default router;
