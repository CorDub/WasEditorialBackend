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

export async function sendSetPasswordMail(email, name, password) {
  try {
    const user = await prisma.user.findUnique({where: {email: email}});
    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com',
      to,
      subject: 'Codigo de confirmacion para su cuenta de Was Editorial - Test',
      text: `Hola ${name}, \n
      Su cuenta de Was Editorial ha sido creado. Encontrara la contrasena aqui abajo:
      ${password}
      \n
      Le pidemos cambiar su contrasena rapidamente en los parametros de su cuenta para evitar cualquier riesgos:\n

      No comparte esta contrasena con otras personas. Was Editorial y sus empleadores nunca se lo pidieran.`
    });
    console.log("Email sent:", info.messageId);
  } catch(error) {
    console.log("Error while trying to send the password email:", password);
  }
}

export async function sendResetPasswordMail(to, name) {
  try {
    const codigo = Math.floor(Math.random()* 900000 + 100000);
    const user = await prisma.user.findUnique({where: {email: to}});
    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com',
      to,
      subject: 'Codigo de confirmacion para su cuenta de Was Editorial - Test',
      text: `Hola ${name}, \n
      Por favor ingrese el siguiente codigo de confirmacion en la pagina de Was:\n
      ${codigo}
      \n
      No comparte este codigo con otras personas. Was Editorial y sus empleadores nunca se lo pidieran.
      Ese codigo estara valido 24 horas.`
    });
    console.log("Email sent:", info.messageId);

    setResetPasswordCode(user.id, codigo);

  } catch(error) {
    console.error('Error sending the set password email:', error);
  }
};
