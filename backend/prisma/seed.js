import { PrismaClient, Role } from '@prisma/client';
import bcrypt from "bcrypt";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateAuthorRevenue, getForMonth } from '../utils.js';
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
        type: "1",
        percentage_royalties: 100,
        percentage_management_stores: 50,
        management_min: 180.00,
        createdAt: twelveMonthsAgo
      }
    })

    const cat2 = await prisma.category.create({
      data: {
        type: "2",
        percentage_royalties: 100,
        percentage_management_stores: 55,
        management_min: 150.00,
        createdAt: twelveMonthsAgo
      }
    })

    const cat3 = await prisma.category.create({
      data: {
        type: "3",
        percentage_royalties: 20,
        percentage_management_stores: 20,
        management_min: 0.00,
        createdAt: twelveMonthsAgo
      }
    })

    /// Add all books from DB

    async function addAuthorFromDB(author) {
      const createdAuthor = await prisma.user.create({
        data: {
          first_name: author.first_name,
          last_name: author.last_name,
          country: "México",
          categoryId: 1,
          createdAt: twelveMonthsAgo
        }
      })
      console.log(createdAuthor.first_name);
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

      const createdBook = await prisma.book.create({
        data: {
          title: book.Title,
          isbn: checkISBN(book.ISBN),
          users: {
            connect: authorsIndexes,
          },
          createdAt: twelveMonthsAgo
        }
      })

      if (createdBook) {
        const randQuant = Math.round(Math.random() * 500);
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
        country: "México",
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
        country: "México",
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
        country: "México",
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
        country: "México",
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
        country: "México",
        email: "JuanAutor@waseditorial.com",
        categoryId: 1,
        password: await bcrypt.hash("PruebaAutor1", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Rebeca",
        last_name: "AutorWasEditorial",
        country: "México",
        email: "RebecaAutor@waseditorial.com",
        categoryId: 1,
        password: await bcrypt.hash("PruebaAutor2", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      },
    });

    await prisma.user.create({
      data: {
        first_name: "Autorino",
        last_name: "Adorno",
        country: "México",
        email: "adorno@gmail.com",
        categoryId: 1,
        password: await bcrypt.hash("bookboi3", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      }
    })

    await prisma.user.create({
      data: {
        first_name: "Corentin",
        last_name: "Dubois",
        country: "Francia",
        email: "corentindubois22@gmail.com",
        categoryId: 1,
        password: await bcrypt.hash("bookboi4", 10),
        role: Role.author,
        createdAt: twelveMonthsAgo
      }
    })

    /// Create Bookstores

    await prisma.bookstore.create({
      data: {
        name: "Plataforma Was",
        deal_percentage: 30,
        createdAt: twelveMonthsAgo,
        color: "#4E5981",
        comissions: true
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
        comissions: true
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
          bookstoreId: 3,
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

      for (let i = 0; i < randQuantTransfers; i++) {
        let createdInventory;
        const randQuantToMove = Math.floor(Math.random() * inventory.current);

        if (randQuantToMove !== 0) {
          if (i < inventory.bookstoreId - 1) {
            createdInventory = await prisma.inventory.create({
              data: {
                bookId: inventory.bookId,
                bookstoreId: i+1,
                country: "México",
                initial: randQuantToMove,
                current: randQuantToMove,
                createdAt: twelveMonthsAgo
              }
            });

            await prisma.inventory.update({
              where: {id: inventory.id},
              data: {
                current: inventory.current - randQuantToMove,
                initial: inventory.initial - randQuantToMove
              }
            });

          } else {
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
                current: inventory.current - randQuantToMove,
                initial: inventory.initial - randQuantToMove
              }
            });
          }

          const createdTransfer = await prisma.transfer.create({
            data: {
              fromInventoryId: inventory.id,
              toInventoryId: createdInventory.id,
              quantity: randQuantToMove,
              createdAt: twelveMonthsAgo
            }
          });
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
            }
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
        bookstore: true
      }
    });

    for (const inventory of newAllInventories) {
      let randQuantToSell = Math.floor(Math.random() * inventory.current);
      if (randQuantToSell === 0) {
        randQuantToSell = 1
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
          const userWithCategory = await prisma.user.findUnique({
            where: {
              id: author
            },
            include: {
              category: true
            }
          })

          // const saleAmount = calculateAuthorRevenue(
          //   inventory.bookstore.comissions,
          //   inventory.price,
          //   userWithCategory.category.management_min,
          //   inventory.bookstore.deal_percentage,
          //   randQuantToSell
          // )

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
                // amount: saleAmount
              }
            });

            paymentsIds.push({"id": createdPayment.id})
            continue;
          }

          // const updatedPayment = await prisma.payment.update({
          //   where: {
          //     id: existingPayment.id
          //   },
          //   data: {
          //     amount: existingPayment.amount + saleAmount
          //   }
          // })

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

    /// Create more fake sales specifically for the test author in the last month
    // const now = new Date();
    // const lastThirtyDays = new Date(now.setDate(now.getDate()-30));
    // console.log("LAST THRIRTY DAYS", lastThirtyDays);

    // const testAuthor = await prisma.user.findUnique({
    //   where: {
    //     id: 148
    //   },
    //   include: {
    //     category: true
    //   }
    // })

    // const testAuthorInventories = await prisma.inventory.findMany({
    //   where: {
    //     book: {
    //       users: {
    //         some: {
    //           id: 148
    //         }
    //       }
    //     }
    //   }
    // });

    // console.log(" TEST AUTHOR INVENTORIES LENGTH", testAuthorInventories.length);

    // let counter = 0;
    // for (const inventory of testAuthorInventories) {
    //   let current = inventory.current;

    //   for (let i = 0; i < 5; i++) {
    //     const randQuant = Math.floor(Math.random() * 20);
    //     const saleDate = new Date(lastThirtyDays);

    //     const randDate = Math.floor(Math.random() * 30)
    //     saleDate.setDate(saleDate.getDate() + randDate);
    //     const saleForMonth = getForMonth(saleDate)

    //     if (inventory === testAuthorInventories[0]) {
    //       console.log("SALE DATE", saleDate);
    //       console.log("CURRENT", current);
    //       console.log("INVENTORY ID", inventory.id);
    //     };

    //     if (randQuant > 0 && current > randQuant) {
    //       const saleAmount = calculateAuthorRevenue(
    //         inventory.comissions,
    //         inventory.price,
    //         testAuthor.category.management_min,
    //         testAuthor.category.percentage_management_stores,
    //         randQuant
    //       )

    //       const existingPayment = await prisma.payment.findUnique({
    //         where: {
    //           userId_forMonth: {
    //             userId: 152,
    //             forMonth: saleForMonth
    //           },
    //         }
    //       });

    //       let createdSale;
    //       if (existingPayment) {
    //         createdSale = await prisma.sale.create({
    //           data: {
    //             inventoryId: inventory.id,
    //             paymentId: existingPayment.id,
    //             quantity: randQuant,
    //             createdAt: saleDate,
    //           }
    //         })

    //         const updatedPayment = await prisma.payment.update({
    //           where: {
    //             id: existingPayment.id
    //           },
    //           data: {
    //             amount: existingPayment.amount + saleAmount
    //           }
    //         })
    //       } else {
    //         const createdPayment = await prisma.payment.create({
    //           data: {
    //             userId: testAuthor.id,
    //             amount: saleAmount,
    //             forMonth: saleForMonth,
    //             createdAt: saleDate
    //           }
    //         });

    //         createdSale = await prisma.sale.create({
    //           data: {
    //             inventoryId: inventory.id,
    //             paymentId: createdPayment.id,
    //             quantity: randQuant,
    //             createdAt: saleDate,
    //           }
    //         })
    //       }
          
    //       counter += 1;
    //       current -= randQuant;

    //       if (createdSale) {
    //         const updtInv = await prisma.inventory.update({
    //           where: {
    //             id: inventory.id
    //           },
    //           data: {
    //             current: current
    //           }
    //         })
    //         if (inventory === testAuthorInventories[0]) {
    //           console.log('UPDT INV CURRENT', updtInv.current);
    //           console.log("------------------------------");
    //         };
    //       }
    //     }
    //   }
    // }
    // console.log(`${counter} SALES CREATED IN THE LAST THIRTY DAYS`);




    
    // Create fake payments

    // let monthlySalesByAuthor = [];

    // /// First get every author
    // const allAuthors =  await prisma.user.findMany({
    //   where: {
    //     isDeleted: false,
    //     role: Role.author
    //   }
    // })

    // ///Then get all sales for each author
    // for (const author of allAuthors) {
    //   let salesByMonths = {};
    //   const data = await prisma.sale.findMany({
    //     where: {
    //       inventory: {
    //         book: {
    //           users: {
    //             some: {
    //               id: author.id
    //             }
    //           }
    //         }
    //       },
    //       isDeleted: false,
    //     },
    //     select: {
    //       id: true,
    //       quantity: true,
    //       createdAt: true,
    //       inventory: {
    //         select: {
    //           price: true,
    //           bookId: true,
    //           bookstore: {
    //             select: {
    //               comissions: true
    //             }
    //           }
    //         }
    //       }
    //     },
    //     orderBy: {
    //       createdAt: 'desc'
    //     }
    //   });

    //   const userCategory = await prisma.category.findUnique({
    //     where: {
    //       id: author.categoryId
    //     }
    //   });

    //   /// Then group them by month
    //   for (const sale of data) {
    //     const numberOfAuthors = await prisma.book.findUnique({
    //       where: {
    //         id: sale.inventory.bookId
    //       },
    //       select: {
    //         _count: {
    //           select: {users: true}
    //         }
    //       }
    //     });

    //     if (salesByMonths[sale.createdAt.toISOString().substring(0,7)]) {
    //       salesByMonths[sale.createdAt.toISOString().substring(0,7)] += (
    //         sale.inventory.bookstore.comissions 
    //           ? (sale.inventory.price 
    //             - userCategory.management_min) 
    //             * sale.quantity 
    //             / numberOfAuthors._count.users
    //           : sale.inventory.price
    //             * sale.quantity
    //             * (userCategory.percentage_management_stores / 100)
    //             * (userCategory.percentage_royalties / 100)
    //             / numberOfAuthors._count.users
    //       )
    //     } else {
    //       salesByMonths[sale.createdAt.toISOString().substring(0,7)] = (
    //         sale.inventory.bookstore.comissions 
    //           ? (sale.inventory.price 
    //             - userCategory.management_min)
    //             * sale.quantity 
    //             / numberOfAuthors._count.users
    //           : sale.inventory.price
    //             * sale.quantity
    //             * (userCategory.percentage_management_stores / 100)
    //             * (userCategory.percentage_royalties / 100)
    //             / numberOfAuthors._count.users
    //       )
    //     }
    //   }

    //   // Make that a list
    //   const salesByMonthsList = Object.entries(salesByMonths);

    //   // Create a new payment for each month
    //   for (const month of salesByMonthsList) {
    //     const newPayment = await prisma.payment.create({
    //       data: {
    //         userId: author.id,
    //         amount: month[1],
    //         forMonth: month[0],
    //         createdAt: new Date(month[0]+'-25')
    //       }
    //     })
    //   }
    // }

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
