import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "Trying McTryPherson",
      email: 'trying@tocheckifitworks.com',
      password: "yesthisisapassword",
    },
  });

  await prisma.user.create({
    data: {
      name: "Administrator McLibro",
      email: "Imake@books.com",
      password: "bookboi",
      is_admin: true
    },
  });

  await prisma.user.create({
    data: {
      name: "Writer McBook",
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
