import nodemailer from 'nodemailer';

var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "e8e5d7d660317a",
    pass: "8e6e2b6f11ca69"
  }
});

async function sendPasswordResetMail(to, subject) {
  try {
    const info = await transport.sendMail({
      from: '"Was TEST" <no-reply@wastest.com',
      to,
      subject: 'Test',
      text: 'Here is your password reset code.'
    });

    console.log("Email sent:", info.messageId);
  } catch(error) {
    console.error('Error sending the password reset email:', error);
  }
};

export default sendPasswordResetMail;
