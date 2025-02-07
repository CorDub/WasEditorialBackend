import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      first_name: "Trying",
      last_name: "McTryPherson",
      country: "Estados Unidos",
      email: 'trying@tocheckifitworks.com',
      password: await bcrypt.hash("yesthisisapassword", 10),
    },
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

  await prisma.user.create({
    data: {
      first_name: "Writer",
      last_name: "McBook",
      country: "Reino Unido",
      email: "booking@alltheway.com",
      password: await bcrypt.hash("writerwriting", 10),
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
      isbn: 9786072927285,
      userId: 1,
    }
  })

  await prisma.book.create({
    data: {
      title: "Tu calabaza gigante",
      pasta: "Dura",
      price: 179.99,
      isbn: 9786075941714,
      userId: 1,
    }
  })

  await prisma.bookstore.create({
    data: {
      name: "Gandhi",
      deal_percentage: 50,
      contact_name: "Gerardo Rivera",
      contact_phone: 525524518965,
      contact_email: "gerardo_rivera@gandhi.com"
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
