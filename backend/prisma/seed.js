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
      category: 2
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
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async()=> {
    await prisma.$disconnect();
  });
