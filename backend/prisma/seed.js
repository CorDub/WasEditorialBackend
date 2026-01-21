import { PrismaClient, Role } from '@prisma/client';
import bcrypt from "bcrypt";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getForMonth } from '../utils.js';
// import authors from "./authors.json" assert {type: 'json'};
// import books from "./books.json" assert {type: 'json'}

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsPath = path.join(__dirname, 'authors.json');
const booksPath = path.join(__dirname, 'books.json');

const authorsRaw = await fs.readFile(authorsPath, 'utf-8');
const booksRaw = await fs.readFile(booksPath, 'utf-8');

const authors = JSON.parse(authorsRaw);
const books = JSON.parse(booksRaw);

async function main() {
  try {
    /// Create categories

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);

    const cat1 = await prisma.category.create({
      data: {
        number: 1,
        category_type: "comissions",
        percentage_management_stores: 5,
        management_min: 180,
        // percentage_royalties: 20,
        // rebate_author: 50,
        createdAt: twelveMonthsAgo
      }
    })

    const cat2 = await prisma.category.create({
      data: {
        number: 2,
        category_type: "regalias",
        percentage_royalties: 20,
        // percentage_management_stores: 5,
        // management_min: 150.00,
        rebate_author: 20,
        createdAt: twelveMonthsAgo
      }
    })

    const cat3 = await prisma.category.create({
      data: {
        number: 3,
        category_type: "comissions",
        percentage_management_stores: 5,
        // rebate_author: 50,
        management_min: 150,
        createdAt: twelveMonthsAgo
      }
    })

    /// Add all books from DB

    async function addAuthorFromDB(author) {
      const createdAuthor = await prisma.user.create({
        data: {
          first_name: author.first_name,
          last_name: author.last_name,
          createdAt: twelveMonthsAgo
        }
      })
    };

    await Promise.all(authors.map(author => addAuthorFromDB(author)));

    async function addBookFromDB(book, authorsIndexes) {
      function checkISBN(isbn) {
        if (isbn === "nan" || isbn === "na") {
          return null
        } else {
          return isbn
        }
      }

      let createdBook;
      try {
        createdBook = await prisma.book.create({
          data: {
            title: book.Title,
            isbn: checkISBN(book.ISBN),
            users: {
              connect: authorsIndexes,
            },
            mainAuthor: authorsIndexes[0].id,
            categoryId: 1,
            createdAt: twelveMonthsAgo
          }
        })
      } catch(error) {
        console.log(error)
      }

      if (createdBook) {
        let randQuant = Math.round(Math.random() * 500);
        if (randQuant === 0) {randQuant +=1};
        const createdImpression = await prisma.impression.create({
          data: {
            bookId: createdBook.id,
            quantity: randQuant,
            createdAt: twelveMonthsAgo,
            date: twelveMonthsAgo
          }
        });
      };
    };

    async function findAuthorWithFullName(user) {
      const foundUser = await prisma.user.findFirst({where: {first_name: user.first_name, last_name: user.last_name}})
      const formatted_user_id = {"id": foundUser.id}
      return formatted_user_id
    }

    await Promise.all(
      books.map(async (book) => {
        let authorsIndexes = await Promise.all(
          book["Author(s)"].map(async (user) => {
            const user_id = await findAuthorWithFullName(user)
            return user_id;
          })
        )
        addBookFromDB(book, authorsIndexes)
      })
    );
    /// Create users

    await prisma.user.create({
      data: {
        first_name: "Administrator",
        last_name: "McLibro",
        email: "Imake@books.com",
        password: await bcrypt.hash("bookboi", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Subadmin",
        last_name: "Pedro",
        email: "yessir@gmail.com",
        password: await bcrypt.hash("bookboi2", 10),
        role: Role.admin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Juan",
        last_name: "AdminWasEditorial",
        email: "JuanAdmin@waseditorial.com",
        password: await bcrypt.hash("PruebaAdmin1", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Rebeca",
        last_name: "AdminWasEditorial",
        email: "RebecaAdmin@waseditorial.com",
        password: await bcrypt.hash("PruebaAdmin2", 10),
        role: Role.superadmin,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Juan",
        last_name: "AutorWasEditorial",
        email: "JuanAutor@waseditorial.com",
        password: await bcrypt.hash("PruebaAutor1", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Rebeca",
        last_name: "AutorWasEditorial",
        email: "RebecaAutor@waseditorial.com",
        password: await bcrypt.hash("PruebaAutor2", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Autorino",
        last_name: "Adorno",
        email: "adorno@gmail.com",
        password: await bcrypt.hash("bookboi3", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      }
    })

    await prisma.user.create({
      data: {
        first_name: "Corentin",
        last_name: "Dubois",
        email: "corentindubois22@gmail.com",
        password: await bcrypt.hash("bookboi4", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      }
    })

    /// Create Bookstores

    await prisma.bookstore.create({
      data: {
        name: "WAS Editorial",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#4E5981",
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Gandhi",
        deal_percentage: 50,
        contact_name: "Gerardo Rivera",
        contact_phone: "525524518965",
        contact_email: "gerardo_rivera@gandhi.com",
        createdAt: twelveMonthsAgo,
        color: "#fff200"
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Mercado Libre",
        deal_percentage: 30,
        contact_name: "Jean Valdez",
        contact_phone: "525580416352",
        contact_email: "jlwotton17@mercadolibre.co.mx",
        createdAt: twelveMonthsAgo,
        color: "#ffe600",
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Amazon",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#f08804"
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Gonvill",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#22ace3"
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Sanborns",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#ff0203"
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Central de",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
      }
    })

    await prisma.bookstore.create({
      data: {
        name: "Aeropuerto CDMX",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#323E48"
      }
    })

    /// Create inventories
    const allImpressions = await prisma.impression.findMany();

    for (const impression of allImpressions) {
      await prisma.inventory.create({
        data: {
          bookId: impression.bookId,
          bookstoreId: 1,
          country: "México",
          initial: impression.quantity,
          current: impression.quantity,
          createdAt: twelveMonthsAgo
        }
      })
    }

    /// Move things around

    const allInventories = await prisma.inventory.findMany();
    const numBookstores = await prisma.bookstore.count();

    for (const inventory of allInventories) {
      const randQuantTransfers = Math.floor(Math.random() * numBookstores);
      let remainingQuantity = inventory.current;
      for (let i = 0; i < randQuantTransfers; i++) {
        let createdInventory;
        const randQuantToMove = Math.floor(Math.random() * 0.5 * remainingQuantity);

        if (randQuantToMove !== 0) {
          createdInventory = await prisma.inventory.create({
            data: {
              bookId: inventory.bookId,
              bookstoreId: i+2,
              country: "México",
              initial: randQuantToMove,
              current: randQuantToMove,
              createdAt: twelveMonthsAgo
            }
          });

          await prisma.inventory.update({
            where: {id: inventory.id},
            data: {
              current: remainingQuantity - randQuantToMove
            }
          });

          const createdTransfer = await prisma.transfer.create({
            data: {
              fromInventoryId: inventory.id,
              toInventoryId: createdInventory.id,
              quantity: randQuantToMove,
              createdAt: twelveMonthsAgo
            }
          });

          remainingQuantity -= randQuantToMove
        }
      }
    }

    // Add test author to 5 books as an author

    async function addingBookToAuthor(email) {
      const user = await prisma.user.findFirst({
        where: {
          email: {
            contains: email
          },
          role: Role.author
        }
      });

      if (!user) {
        console.log('User not found', email);
        return;
      }

      const randomBooks = await prisma.book.findMany({
        take: 5,
        where: {
          NOT: {
            users: {
              some: {
                id: user.id
              }
            }
          }
        }
      });

      for (const book of randomBooks) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            users: {
              connect: { id: user.id }
            },
            mainAuthor: user.id
          }
        });
      }
    }

    await addingBookToAuthor("adorno");
    await addingBookToAuthor("Rebeca");
    await addingBookToAuthor("Juan");

    /// Create fake sales

    const newAllInventories = await prisma.inventory.findMany({
      include: {
        bookstore: true,
        book: true,
        transfersFrom: true
      }
    });

    for (const inventory of newAllInventories) {
      let remainingSales = inventory.current;
      let randQuantToSell = Math.floor(Math.random() * 0.5 * remainingSales);
      if (randQuantToSell === 0) {
        continue;
      }

      if (randQuantToSell > 0) {
        const monthsAgo = Math.floor(Math.random() * 13);
        let saleDate = new Date();
        saleDate.setMonth(saleDate.getMonth() - monthsAgo);

        const saleForMonth = getForMonth(saleDate);

        const book = await prisma.book.findUnique({
          where: {
            id: inventory.bookId
          },
          select: {
            users: {
              select: {
                id: true
              }
            }
          }
        })

        const authorIds = book.users.map(user => user.id)
        let paymentsIds = [];
        for (const author of authorIds) {

          const existingPayment = await prisma.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: author,
                forMonth: saleForMonth
              }
            }
          });

          if (!existingPayment) {
            const createdPayment = await prisma.payment.create({
              data: {
                userId: author,
                forMonth: saleForMonth,
                createdAt: saleDate,
              }
            });

            paymentsIds.push({"id": createdPayment.id})
            continue;
          }

          paymentsIds.push({"id": existingPayment.id})
        }

        const createdSale = await prisma.sale.create({
          data: {
            inventoryId: inventory.id,
            quantity: randQuantToSell,
            payments: {
              connect: paymentsIds
            },
            createdAt: saleDate,
            date: saleDate
          }
        })

        if (createdSale) {
          const updatedInventory = await prisma.inventory.update({
            where: {id: inventory.id},
            data: {
              current: inventory.current - randQuantToSell
            }
          });

        } else {
          console.log("\n SALE WASNT CREATED \n");
          console.log("\n INVENTORY \n", inventory);
          console.log("\n RANDQUANT TO SELL \n", randQuantToSell);
        }
      };
    }

    /// CREATE FAKE KINDLE SALES

    const newAllBooks = await prisma.book.findMany({
      include: {
        users: true
      }
    });

    for (const book of newAllBooks) {
      let randQuantToSell = Math.floor(Math.random() * 100);
      if (randQuantToSell === 0) {
        randQuantToSell = 1
      }
      let randQuantPod = Math.floor(Math.random() * 100);

      if (randQuantToSell > 0) {
        const monthsAgo = Math.floor(Math.random() * 13);
        let kindleSaleDate = new Date();
        kindleSaleDate.setMonth(kindleSaleDate.getMonth() - monthsAgo);
        let dateCut = new Date(kindleSaleDate);
        dateCut.setMonth(dateCut.getMonth()-2);

        const saleForMonth = getForMonth(kindleSaleDate);

        const authorIds = book.users.map(user => user.id)
        let paymentsIds = [];
        for (const author of authorIds) {
          const existingPayment = await prisma.payment.findUnique({
            where: {
              userId_forMonth: {
                userId: author,
                forMonth: saleForMonth
              }
            }
          });

          if (!existingPayment) {
            const createdPayment = await prisma.payment.create({
              data: {
                userId: author,
                forMonth: saleForMonth,
                createdAt: kindleSaleDate,
              }
            });

            paymentsIds.push({"id": createdPayment.id})
            continue;
          }

          paymentsIds.push({"id": existingPayment.id})
        }

        const createdKindleSale = await prisma.kindleSale.create({
          data: {
            bookId: book.id,
            payments: {
              connect: paymentsIds
            },
            quantityEbook: randQuantToSell,
            quantityPod: randQuantPod,
            dateCut: dateCut,
            datePay: kindleSaleDate,
            regalias: ((randQuantToSell + randQuantPod) * 299.99),
            createdAt: kindleSaleDate,
          }
        })
      };
    }
  } catch (error) {
    console.error("Error somewhere", error);
  }
}


main()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
