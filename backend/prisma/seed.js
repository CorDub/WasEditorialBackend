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
      percentage_royalties: 100,
      percentage_management_stores: 50,
      management_min: 180.00
    }
  })

  await prisma.category.create({
    data: {
      percentage_royalties: 100,
      percentage_management_stores: 55,
      management_min: 150.00
    }
  })

  await prisma.category.create({
    data: {
      percentage_royalties: 20,
      percentage_management_stores: 20,
      management_min: 0.00
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
