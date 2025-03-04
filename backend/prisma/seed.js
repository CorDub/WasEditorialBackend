import { PrismaClient, Role } from '@prisma/client';
import bcrypt from "bcrypt";
import authors from "/home/cordub/code/CorDub/WasEditorialBackend/helpers/authors.json" assert {type: 'json'};
import books from "/home/cordub/code/CorDub/WasEditorialBackend/helpers/books.json" assert {type: 'json'}

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
      if (isbn === "nan") {
        return ""
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
      contact_name: "Jack Wotton",
      contact_phone: "525580416352",
      contact_email: "jlwotton17@mercadolibre.co.mx"
    }
  })

  await prisma.inventory.create({
    data: {
      bookId: 1,
      bookstoreId: 1,
      country: "Mexico",
      initial: 1000,
    }
  })

  await prisma.inventory.create({
    data: {
      bookId: 2,
      bookstoreId: 1,
      country: "Mexico",
      initial: 1000,
    }
  })

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
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async()=> {
    await prisma.$disconnect();
  });
