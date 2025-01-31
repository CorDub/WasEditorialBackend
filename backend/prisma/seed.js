import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      first_name: "Trying",
      last_name: "McTryPherson",
      country: "Estados Unidos",
      email: 'trying@tocheckifitworks.com',
      password: "yesthisisapassword",
    },
  });

  await prisma.user.create({
    data: {
      first_name: "Administrator",
      last_name: "McLibro",
      country: "Mexico",
      email: "Imake@books.com",
      password: "bookboi",
      is_admin: true
    },
  });

  await prisma.user.create({
    data: {
      first_name: "Writer",
      last_name: "McBook",
      country: "Reino Unido",
      email: "booking@alltheway.com",
      password: "writerwriting"
    },
  });

  await prisma.category.create({
    data: {
      percentage_royalties: 100,
      percentage_management_stores: 50,
      management_min: 180.00
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
