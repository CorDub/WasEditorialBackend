import crypto from 'crypto';
import { prisma } from "./server.js"

export function createRandomPassword() {
  const pw = crypto.randomBytes(12).toString('hex');
  return pw
}

export async function setResetPasswordCode(user_id, code) {
  try {
    const set_code = await prisma.user.update({
      where : {id: user_id},
      data: {reset_password_code: code},
    })
    console.log(set_code);

    setTimeout(() => {
      const invalidate_code = prisma.user.update({
        where: {id: user_id},
        data: {reset_password_code: null},
      });
      console.log(invalidate_code);
    }, 1 * 24 * 60 * 60 * 1000);

  } catch(error) {
    console.error('Error setting the reset_password_code:', error);
  }
}

export async function matchConfirmationCode(confirmation_code, user_id) {
  try {
    const user = await prisma.user.findUnique({where:{
      id: user_id,
      isDeleted: false
      }});
    if (user === false) {
      throw new Error('No user found.')
    };

    if (
      user.reset_password_code === confirmation_code &&
      user.reset_password_code !== null
    ) {
      await prisma.user.update({
        where: {id: user_id},
        data: {reset_password_code: null},
      });
      return true;
    } else {
      return false;
    }

  } catch(error) {
    console.error('Error during the confirmation function:', error);
  }
}

export function calculateAuthorRevenue(
  onComission, 
  price, 
  management, 
  storeCutPercent, 
  quantity) {

    let res = 0;
    if (onComission) {
      res = ((price - management) * quantity)
    } else {
      // console.log("")
      // console.log("price", price)
      // console.log("storeCutPercent", storeCutPercent)
      // console.log("quantity", quantity)
      res = ((price - (price * storeCutPercent / 100)) * quantity)
      // console.log("res", res)
    }

    if (res < 0.001) {
      res = 0
    }

    return res
}

export function getForMonth(timestamp) {
  const date = new Date(timestamp);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const forMonth = year + "-" + month
  return forMonth
}