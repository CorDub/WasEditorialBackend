import { setResetPasswordCode } from './passwordUtils.js';
import { prisma } from "./prisma/client.js"
import { Resend } from "resend";
import nodemailer from "nodemailer";

// const resend = new Resend(process.env.RESEND_API_KEY);

let resend;
let mailtrap;

export function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY missing');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export function getMailtrap() {
  if (!mailtrap) {
    mailtrap = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      }
    });
  }

  return mailtrap
}

async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("no email sent for test")
      return ("test environment - no email sent")

    } else if (process.env.NODE_ENV === "staging") {
      const finalTo = process.env.STAGING_EMAIL_REDIRECT

      const transport = getMailtrap()
      const info = await transport.sendMail({
        from: '"WAS Staging" <no-reply@plataformawas.xyz>',
        to: finalTo,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments
      });

      console.log("Message sent:", info.messageId);

    } else if (process.env.NODE_ENV === "production") {
      const resend = getResend();

      const {data, error} = await resend.emails.send({
        from: '"WAS Editorial" <no-reply@distribucionwas.com>',
        to: to,
        subject,
        text,
        html,
        attachments,
      });

      if (error) {
        throw new Error (JSON.stringify(error))
      }

      return data;
    }
  } catch(error) {
    console.error(error)
    throw error
  }
}

export async function sendSetPasswordMail(email, name, password) {
  try {
    await sendEmail({
      to: email,
      subject: 'Código de confirmación para su cuenta de Was Editorial',
      text: `Hola ${name}, \n
      Su cuenta de Was Editorial ha sido creada. Encontrará la contraseña aqui:
      ${password}
      \n
      Le pidemos cambiar su contraseña rapidamente en los parametros de su cuenta para evitar cualquier riesgos.\n

      No comparte esta contraseña con otras personas. Was Editorial y sus empleadores nunca se la pidieran.`
    });
  } catch(error) {
    console.error("Error while trying to send the password email:", error);
  }
}

export async function sendWelcomeMail(email, name) {
  try {
    let siteUrl;
    if (process.env.NODE_ENV != "production") {
      siteUrl = process.env.STAGING_APP_URL
    } else {
      siteUrl = process.env.PRODUCTION_APP_URL
    }

    await sendEmail({
      to: email,
      subject: `Bienvenido en la pagina de autores de WAS`,
      html: `<p>Hola ${name}, \n</p>
      <p>Abrimos tu cuenta en la pagina para autores de WAS Editorial donde vas a poder seguir las ventas y
      resultados de tus libros.</p>
      <a href="${siteUrl}">Entra</a>
      <p>Solo haga clic en "Primera visita o olvidó su contraseña" para empezar el proceso de ingreso.</p>
      `
    })
  } catch(error) {
    console.error("Error while sending the welcome mail:", error);
  }
}

export async function sendResetPasswordMail(to, name) {
  try {
    const codigo = Math.floor(Math.random()* 900000 + 100000);
    const user = await prisma.user.findUnique({where: {email: to}});
    if (!user) throw new Error(`User not found for email: ${to}`);
    setResetPasswordCode(user.id, codigo);
    await sendEmail({
      to,
      subject: 'Código de confirmación para su cuenta de Was Editorial',
      text: `Hola ${name}, \n
      Por favor ingrese el siguiente código de confirmación en la pagina de Was:\n
      ${codigo}
      \n
      No comparte este codigó con otras personas. Was Editorial y sus empleadores nunca se lo pidieran.
      Ese codigo estará valido 24 horas.`
    });

  } catch(error) {
    console.error('Error sending the set password email:', error);
  }
};

export async function sendEmailWithInvoice(name, month, amount, factura, constancia, correo) {
  try {
    const mimeToExtension = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpeg",
      "image/png": ".png"
    }

    await sendEmail({
      to: "wasfinanzas@gmail.com",
      subject: `Nueva factura de ${name} para el mes de ${month}`,
      text: `Hola, \n
      Eso es un correo automatico mandado por el sitio web de Was Editorial.
      ${name}, con correo ${correo} solicitó nueva factura de $ ${amount} para el mes de ${month}.
      Está adjunto al correo con la constancia de situación fiscal.`,
      attachments: [
        {
          filename: `Factura ${name} - ${month} - ${amount}${mimeToExtension[factura.mimetype]}`,
          content: factura.buffer,
          // contentType: factura.mimetype
        },
        {
          filename: `Constancia ${name}${mimeToExtension[constancia.mimetype]}`,
          content: constancia.buffer,
          // contentType: factura.mimetype
        }
      ]
    })
  } catch(error) {
    console.error('Error sending the invoice email:', error);
  }
}
