import nodemailer from 'nodemailer';
import { setResetPasswordCode } from './utils.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "e8e5d7d660317a",
    pass: "8e6e2b6f11ca69"
  }
});

export async function sendSetPasswordMail(to, name) {
  try {
    const codigo = Math.floor(Math.random()* 900000 + 100000);
    const user = await prisma.user.findUnique({where: {email: to}});
    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com',
      to,
      subject: 'Codigo de confirmacion para su cuenta de Was Editorial - Test',
      text: `Hola ${name}, \n
      Para finalizar su connexion a su cuenta de Was Editorial,
      por favor ingrese el siguiente codigo de confirmacion en este pagina:\n
      http://localhost:5173/confirmation-code?id=${user.id}\n
      ${codigo}
      \n
      No comparte este codigo con otras personas. Was Editorial y sus empleadores nunca se lo pidieran.`
    });
    console.log("Email sent:", info.messageId);

    setResetPasswordCode(user.id, codigo);

  } catch(error) {
    console.error('Error sending the set password email:', error);
  }
};
