import nodemailer from 'nodemailer';
import { setResetPasswordCode } from './utils.js';
import { prisma } from "./prisma/client.js"

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
      from: '"Was TEST" <no-reply@wastest.com>',
      to: email,
      subject: 'Codigo de confirmación para su cuenta de Was Editorial',
      text: `Hola ${name}, \n
      Su cuenta de Was Editorial ha sido creada. Encontrará la contraseña aqui:
      ${password}
      \n
      Le pidemos cambiar su contraseña rapidamente en los parametros de su cuenta para evitar cualquier riesgos.\n

      No comparte esta contraseña con otras personas. Was Editorial y sus empleadores nunca se la pidieran.`
    });
    console.log("Email sent:", info.messageId);
  } catch(error) {
    console.log("Error while trying to send the password email:", error);
  }
}

export async function sendResetPasswordMail(to, name) {
  try {
    const codigo = Math.floor(Math.random()* 900000 + 100000);
    const user = await prisma.user.findUnique({where: {email: to}});
    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com>',
      to,
      subject: 'Codigo de confirmación para su cuenta de Was Editorial',
      text: `Hola ${name}, \n
      Por favor ingrese el siguiente codigo de confirmación en la pagina de Was:\n
      ${codigo}
      \n
      No comparte este codigo con otras personas. Was Editorial y sus empleadores nunca se lo pidieran.
      Ese codigo estará valido 24 horas.`
    });
    console.log("Email sent:", info.messageId);

    setResetPasswordCode(user.id, codigo);

  } catch(error) {
    console.error('Error sending the set password email:', error);
  }
};

export async function sendEmailWithInvoice(name, month, amount, uso, factura, constancia, correo) {
  try {
    const mimeToExtension = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpeg",
      "image/png": ".png"
    }

    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com>',
      to: "example@test.was.com",
      subject: `Nueva factura de ${name} para el mes de ${month}`,
      text: `Hola, \n
      Eso es un correo automatico mandado por el sitio web de Was Editorial.
      ${name}, con correo ${correo} solicitó nueva factura de $ ${amount} para el mes de ${month}.
      Está adjunto al correo con la constancia de situación fiscal.
      El uso de CFDI dado es ${uso}.`,
      attachments: [
        {
          filename: `Factura ${name} - ${month} - ${amount}${mimeToExtension[factura.mimetype]}`,
          content: factura.buffer
        },
        {
          filename: `Constancia ${name}${mimeToExtension[constancia.mimetype]}`,
          content: constancia.buffer
        }
      ]
    })
  } catch(error) {
    console.error('Error sending the invoice email:', error);
  }
}
