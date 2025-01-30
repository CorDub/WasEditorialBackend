import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function createRandomPassword() {
  const pw = crypto.randomBytes(12).toString('hex');
  return pw
}

export async function setResetPasswordCode(email, code) {
  try {
    const set_code = await prisma.user.update({
      where : {email: email},
      data: {reset_password_code: code},
    })
    console.log(set_code);

    setTimeout(() => {
      const invalidate_code = prisma.user.update({
        where: {email: email},
        data: {reset_password_code: null},
      });
      console.log(invalidate_code);
    }, 1 * 24 * 60 * 60 * 1000);

  } catch(error) {
    console.error('Error setting the reset_password_code:', error);
  }
}

export async function matchConfirmationCode(confirmation_code, email) {
  try {
    console.log("in match confirmation code");
    const user = await prisma.user.findUnique({where: {email: email}});
    if (user === false) {
      throw new Error('No user found.')
    };

    if (user.reset_password_code === confirmation_code) {
      return true;
    } else {
      return false;
    }

  } catch(error) {
    console.error('Error during the confirmation function:', error);
  }
}
