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
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async()=> {
    await prisma.$disconnect();
  });
