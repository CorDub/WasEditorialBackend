import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";
import authors from "/home/cordub/code/CorDub/WasEditorialBackend/helpers/authors.json" assert {type: 'json'};

const prisma = new PrismaClient();

async function main() {
  async function addAuthorFromDB(author) {
    await prisma.user.create({
      data: {
        first_name: author.first_name,
        last_name: author.last_name,
        country: "Mexico",
      }
    })
  };

  authors.forEach((author) => {
    addAuthorFromDB(author)
  });

  await prisma.user.create({
    data: {
      first_name: "Administrator",
      last_name: "McLibro",
      country: "Mexico",
      email: "Imake@books.com",
      password: await bcrypt.hash("bookboi", 10),
      is_admin: true
    },
  });

  await prisma.category.create({
    data: {
      type: 1,
      percentage_royalties: 100,
      percentage_management_stores: 50,
      management_min: 180.00
    }
  })

  await prisma.category.create({
    data: {
      type: 2,
      percentage_royalties: 100,
      percentage_management_stores: 55,
      management_min: 150.00
    }
  })

  await prisma.category.create({
    data: {
      type: 3,
      percentage_royalties: 20,
      percentage_management_stores: 20,
      management_min: 0.00
    }
  })

  await prisma.book.create({
    data: {
      title: "Si vas a soñar haz lo en grande",
      pasta: "Blanda",
      price: 149.99,
      isbn: "9786072927285",
      users: {
        connect: [{id: 1}, {id: 3}]
      }
    }
  })

  await prisma.book.create({
    data: {
      title: "Tu calabaza gigante",
      pasta: "Dura",
      price: 179.99,
      isbn: "9786075941714",
      users: {
        connect: [{id: 1}, {id: 3}]
      }
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

}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async()=> {
    await prisma.$disconnect();
  });
