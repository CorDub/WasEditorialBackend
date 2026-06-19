import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import {
  createCategory,
  createAuthor,
  createBook,
  createBookstore,
  createInventory,
  createImpression,
  createPayment,
  createSale,
  createKindleSale,
  createCost,
  createTestDB,
  dropTestDB,
  deleteFromDB,
  truncateAll
} from "../../testUtils.js";
import { PrismaClient } from '@prisma/client';
import crypto from "crypto";
import * as mailer from "../../mailer.js";

let prisma;
let testDBName;

beforeAll(async() => {
  testDBName = createTestDB();
  process.env.DATABASE_URL= `postgresql://cordub:ThankGod89!@localhost:5432/${testDBName}`;
  prisma = new PrismaClient();
  await prisma.$connect();
})

afterAll(async() => {
  await prisma.$disconnect();
  dropTestDB(testDBName);
})

describe(`send token reset email - happy path`, () => {
  let user, updatedUser, token, sendEmailSpy;

  beforeAll(async() => {
    user = await createAuthor(prisma, {email: "corentindubois45@gmail.com"});
    token = crypto.randomBytes(32).toString("hex");

    // sendEmailSpy = vi.spyOn(mailer, "sendEmail").mockResolvedValue();

    await mailer.sendTokenResetPasswordMail("corentindubois45@gmail.com", "Corentin", token, prisma)
    updatedUser = await prisma.user.findUnique({where: {email: "corentindubois45@gmail.com"}})
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  // it(`should call the sendEmail function to the correct user`, async() => {
  //   console.log(sendEmailSpy.mock.calls)
  //   expect(sendEmailSpy).toHaveBeenCalledWith({
  //     to: "corentindubois45@gmail.com",
  //     subject: 'Restablecimiento de su contraseña para su cuenta de WAS Editorial',
  //     text: `Hola Corentin, \n
  //     Por favor haga clic en el siguiente enlace para restablecer (o establecer si es su primera visita) la contraseña de su cuenta de WAS Editorial:\n
  //     http://localhost:5173/change-password?token=${token}
  //     \n
  //     Este enlace estará válido por 1 hora.`
  //   })
  // })

  it(`should update the user with the correct token`, async() => {
    expect(updatedUser.reset_password_token).toBe(token)
  })

  it(`should update the user with the correct expiry time`, async() => {
    const expiry = updatedUser.reset_password_expires.getTime();
    const oneHour = Date.now() + 60 * 60 * 1000;
    const tolerance = 5000;
    expect(expiry).toBeGreaterThanOrEqual(oneHour - tolerance)
    expect(expiry).toBeLessThanOrEqual(oneHour + tolerance)
  })
})



describe(`send token reset email - wrong email`, () => {
  let user, token;

  beforeAll(async() => {
    user = await createAuthor(prisma, {email: "corentindubois45@gmail.com"});
    token = crypto.randomBytes(32).toString("hex");
  })

  afterAll(async() => {
    await truncateAll(prisma)
  })

  it(`should throw an error`, async() => {
    await expect(mailer.sendTokenResetPasswordMail("corentindubois22@gmail.com", "Corentin", token, prisma))
      .rejects.toThrow(`User not found for email: corentindubois22@gmail.com`)
  })
})