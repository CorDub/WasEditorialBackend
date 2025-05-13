import { PrismaClient, Role } from '@prisma/client';
import bcrypt from "bcrypt";
import authors from "../../helpers/authors.json" assert {type: 'json'};
import books from "../../helpers/books.json" assert {type: 'json'}

const prisma = new PrismaClient();

async function main() {
  /// Create categories

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);

  await prisma.category.create({
    data: {
      type: "1",
      percentage_royalties: 100,
      percentage_management_stores: 50,
      management_min: 180.00,
      createdAt: twelveMonthsAgo
    }
  })

  await prisma.category.create({
    data: {
      type: "2",
      percentage_royalties: 100,
      percentage_management_stores: 55,
      management_min: 150.00,
      createdAt: twelveMonthsAgo
    }
  })

  await prisma.category.create({
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
    await prisma.user.create({
      data: {
        first_name: author.first_name,
        last_name: author.last_name,
        country: "México",
        categoryId: 1,
        createdAt: twelveMonthsAgo
      }
    })
  };

  authors.forEach((author) => {
    addAuthorFromDB(author)
  });

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
          createdAt: twelveMonthsAgo
        }
      });
    };
  };

  async function findAuthorWithFullName(user) {
    const foundUser = await prisma.user.findFirst({where: {first_name: user.first_name, last_name: user.last_name}})
    const formatted_user_id = {"id": foundUser.id}
    return formatted_user_id
  }

  books.map(async (book) => {
    let authorsIndexes = await Promise.all(
      book["Author(s)"].map(async (user) => {
        const user_id = await findAuthorWithFullName(user)
        return user_id;
      })
    )
    addBookFromDB(book, authorsIndexes)
  });

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
      first_name: "Autorino",
      last_name: "Adorno",
      country: "México",
      email: "adorno@gmail.com",
      categoryId: 1,
      password: await bcrypt.hash("bookboi3", 10),
      role: Role.author,
      createdAt: twelveMonthsAgo
    },
  });

  /// Create Bookstores

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
      color: "#ffe600"
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Plataforma Was",
      deal_percentage: 30,
      createdAt: twelveMonthsAgo,
      color: "#4E5981"
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

  /// Create fake sales

  const newAllInventories = await prisma.inventory.findMany();

  for (const inventory of newAllInventories) {
    let randQuantToSell = Math.floor(Math.random() * inventory.current);
    if (randQuantToSell === 0) {
      randQuantToSell = 1
    }

    if (randQuantToSell > 0) {
      const monthsAgo = Math.floor(Math.random() * 13);
      let saleDate = new Date();
      saleDate.setMonth(saleDate.getMonth() - monthsAgo);

      const createdSale = await prisma.sale.create({
        data: {
          inventoryId: inventory.id,
          quantity: randQuantToSell,
          createdAt: saleDate
        }
      });

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

  // Add test author to 5 books as an author
  const user = await prisma.user.findFirst({
    where: {
      email: {
        contains: 'adorno'
      }
    }
  });

  if (!user) {
    console.log('User not found');
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

  /// Create more fake sales specifically for the test author in the last month
  const now = new Date();
  const lastThirtyDays = new Date(now.setDate(now.getDate()-30));
  console.log("LAST THRIRTY DAYS", lastThirtyDays);

  const testAuthorInventories = await prisma.inventory.findMany({
    where: {
      book: {
        users: {
          some: {
            id: 148
          }
        }
      }
    }
  });

  console.log(" TEST AUTHOR INVENTORIES LENGTH", testAuthorInventories.length);

  let counter = 0;
  for (const inventory of testAuthorInventories) {
    let current = inventory.current;

    for (let i = 0; i < 5; i++) {
      const randQuant = Math.floor(Math.random() * 20);
      const saleDate = new Date(lastThirtyDays);

      const randDate = Math.floor(Math.random() * 30)
      saleDate.setDate(saleDate.getDate() + randDate);

      if (inventory === testAuthorInventories[0]) {
        console.log("SALE DATE", saleDate);
        console.log("CURRENT", current);
        console.log("INVENTORY ID", inventory.id);
      };

      if (randQuant > 0 && current > randQuant) {
        const createdSale = await prisma.sale.create({
          data: {
            inventoryId: inventory.id,
            quantity: randQuant,
            createdAt: saleDate,
          }
        })
        counter += 1;
        current -= randQuant;

        if (createdSale) {
          const updtInv = await prisma.inventory.update({
            where: {
              id: inventory.id
            },
            data: {
              current: current
            }
          })
          if (inventory === testAuthorInventories[0]) {
            console.log('UPDT INV CURRENT', updtInv.current);
            console.log("------------------------------");
          };
        }
      }
    }
  }
  console.log(`${counter} SALES CREATED IN THE LAST THIRTY DAYS`);

  // Create fake payments

  let monthlySalesByAuthor = [];

  /// First get every author
  const allAuthors =  await prisma.user.findMany({
    where: {
      isDeleted: false,
      role: Role.author
    }
  })

  ///Then get all sales for each author
  for (const author of allAuthors) {
    let salesByMonths = {};
    const data = await prisma.sale.findMany({
      where: {
        inventory: {
          book: {
            users: {
              some: {
                id: author.id
              }
            }
          }
        },
        isDeleted: false,
      },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
        inventory: {
          select: {
            book: {
              select: {
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const userCategory = await prisma.category.findUnique({
      where: {
        id: author.categoryId
      }
    });

    /// Then group them by month
    for (const sale of data) {
      if (salesByMonths[sale.createdAt.toISOString().substring(0,7)]) {
        salesByMonths[sale.createdAt.toISOString().substring(0,7)] += (
          (sale.inventory.book.price * sale.quantity)
          * (userCategory.percentage_management_stores / 100)
          * (userCategory.percentage_royalties / 100)
        )
      } else {
        salesByMonths[sale.createdAt.toISOString().substring(0,7)] = (
          (sale.inventory.book.price * sale.quantity)
          * (userCategory.percentage_management_stores / 100)
          * (userCategory.percentage_royalties / 100)
        )
      }
    }

    // Make that a list
    const salesByMonthsList = Object.entries(salesByMonths);

    // Create a new payment for each month
    for (const month of salesByMonthsList) {
      const newPayment = await prisma.payment.create({
        data: {
          userId: author.id,
          amount: month[1],
          forMonth: month[0],
          createdAt: new Date(month[0]+'-25')
        }
      })
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async()=> {
    await prisma.$disconnect();
  });
