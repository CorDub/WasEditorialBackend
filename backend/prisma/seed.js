import { PrismaClient, Role } from '@prisma/client';
import bcrypt from "bcrypt";
import authors from "../../helpers/authors.json" assert {type: 'json'};
import books from "../../helpers/books.json" assert {type: 'json'}

const prisma = new PrismaClient();

async function main() {
  async function addAuthorFromDB(author) {
    await prisma.user.create({
      data: {
        first_name: author.first_name,
        last_name: author.last_name,
        country: "México",
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

    await prisma.book.create({
      data: {
        title: book.Title,
        isbn: checkISBN(book.ISBN),
        users: {
          connect: authorsIndexes,
        },
      }
    })
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

  await prisma.user.create({
    data: {
      first_name: "Administrator",
      last_name: "McLibro",
      country: "México",
      email: "Imake@books.com",
      password: await bcrypt.hash("bookboi", 10),
      role: Role.superadmin
    },
  });

  await prisma.user.create({
    data: {
      first_name: "Subadmin",
      last_name: "Pedro",
      country: "México",
      email: "yessir@gmail.com",
      password: await bcrypt.hash("bookboi2", 10),
      role: Role.admin
    },
  });

  await prisma.user.create({
    data: {
      first_name: "Autorino",
      last_name: "Adorno",
      country: "México",
      email: "adorno@gmail.com",
      password: await bcrypt.hash("bookboi3", 10),
      role: Role.author
    },
  });

  await prisma.category.create({
    data: {
      type: "1",
      percentage_royalties: 100,
      percentage_management_stores: 50,
      management_min: 180.00
    }
  })

  await prisma.category.create({
    data: {
      type: "2",
      percentage_royalties: 100,
      percentage_management_stores: 55,
      management_min: 150.00
    }
  })

  await prisma.category.create({
    data: {
      type: "3",
      percentage_royalties: 20,
      percentage_management_stores: 20,
      management_min: 0.00
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Gandhi",
      deal_percentage: 50,
      contact_name: "Gerardo Rivera",
      contact_phone: "525524518965",
      contact_email: "gerardo_rivera@gandhi.com"
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Mercado Libre",
      deal_percentage: 30,
      contact_name: "Jean Valdez",
      contact_phone: "525580416352",
      contact_email: "jlwotton17@mercadolibre.co.mx"
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Plataforma Was",
      deal_percentage: 30,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Amazon",
      deal_percentage: 30,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Gonvill",
      deal_percentage: 30,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Sanborns",
      deal_percentage: 30,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Central de",
      deal_percentage: 30,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Aeropuerto CDMX",
      deal_percentage: 30,
    }
  })

  await prisma.inventory.create({
    data: {
      bookId: 1,
      bookstoreId: 1,
      country: "México",
      initial: 1000,
      current: 1000
    }
  })

  await prisma.inventory.create({
    data: {
      bookId: 2,
      bookstoreId: 1,
      country: "México",
      initial: 1000,
      current: 1000
    }
  })

  const booksCount = await prisma.book.count();
  const bookstoresCount = await prisma.bookstore.count();

  async function createRandomInventory() {
    const bookId = Math.floor(Math.random() * (booksCount)) + 1;
    const bookstoreId = Math.floor(Math.random() * (bookstoresCount)) + 1;

    const existingInventory = await prisma.inventory.findFirst({
      where: {
        bookId: bookId,
        bookstoreId: bookstoreId,
        country: "México"
      }
    });

    if (!existingInventory) {
      const initialInventory = Math.floor(Math.random() * 1000);
      await prisma.inventory.create({
        data: {
          bookId: bookId,
          bookstoreId: bookstoreId,
          country: "México",
          initial: initialInventory,
          current: Math.floor(Math.random() * initialInventory)
        }
      });
    }
  }

  await Promise.all(
    [...Array(30)].map(() =>
      createRandomInventory()
    )
  );

  await prisma.sale.create({
    data: {
      inventoryId: 1,
      quantity: 10
    }
  })

  await prisma.sale.create({
    data: {
      inventoryId: 2,
      quantity: 18
    }
  })

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

  const bookstores = await prisma.bookstore.findMany({
    where: {
      isDeleted: false
    }
  });

  const inventories = [];
  for (const book of randomBooks) {
    for (const bookstore of bookstores) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          bookId: book.id,
          bookstoreId: bookstore.id,
          country: 'México'
        }
      });

      if (!existingInventory) {
        const inventory = await prisma.inventory.create({
          data: {
            bookId: book.id,
            bookstoreId: bookstore.id,
            country: 'México',
            initial: 100,
            current: 100
          }
        });
        inventories.push(inventory);
      } else {
        inventories.push(existingInventory);
      }
    }
  }

  for (const inventory of inventories) {
    const existingSales = await prisma.sale.findFirst({
      where: {
        inventoryId: inventory.id
      }
    });

    if (!existingSales) {
      const numSales = Math.floor(Math.random() * 11) + 5;
      for (let i = 0; i < numSales; i++) {
        const quantity = Math.floor(Math.random() * 5) + 1;
        // Generate a random date within the last 12 months
        const monthsAgo = Math.floor(Math.random() * 12);
        const saleDate = new Date();
        saleDate.setMonth(saleDate.getMonth() - monthsAgo);

        await prisma.sale.create({
          data: {
            inventoryId: inventory.id,
            quantity: quantity,
            createdAt: saleDate
          }
        });
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            current: {
              decrement: quantity
            }
          }
        });
      }
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
