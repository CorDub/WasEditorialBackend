import crypto from 'crypto';
import { prisma } from "./prisma/client.js"

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

export function convertISOString(date) {
  const JsonParsedDate = JSON.stringify(date);
  const justDateNoTime = JsonParsedDate.split("T")[0]
  const cleanedDate = justDateNoTime.split('"')[1]
  return cleanedDate
}

export function generateMonthKeysForRange(startDate, endDate) {
  const startString = convertISOString(startDate);
  const endString = convertISOString(endDate);

  const start = startString.substring(0,7);
  const end = endString.substring(0,7);
  let numMonthsInRange = 0;
  if (start.substring(0,4) === end.substring(0,4)) {
    numMonthsInRange = Number(end.substring(5,7)) - Number(start.substring(5,7)) + 1;
  } else {
    numMonthsInRange = Number(end.substring(5,7)) 
      + (Number(end.substring(0,4)) - Number(start.substring(0,4))) * 12
      - Number(start.substring(5,7))
  }
  
  let monthKeysInRange = []
  for (let i = 0; i <= numMonthsInRange; i++) {
    const month = (Number(start.substring(5,7)) + i) - (12 * Math.trunc((Number(start.substring(5,7)) + i -1)/12)) 
    const year = Number(start.substring(0,4)) + (Math.trunc((Number(start.substring(5,7)) + i - 1) / 12))
    const monthKey = String(year) + "-" + String(month).padStart(2, "0");
    monthKeysInRange.push(monthKey)
  }

  return monthKeysInRange
}

export function twelveMonthsAgo() {
  const now = new Date();
  let remainder = 12 - (now.getMonth());
  let twelveMonthsAgo;
  if (remainder > 0) {
    const minusOneYear = new Date(now.setFullYear(now.getFullYear()-1))
    twelveMonthsAgo = new Date(minusOneYear.setMonth(12-remainder));
  } else {
    twelveMonthsAgo = new Date(now.setMonth(remainder));
  }
  return twelveMonthsAgo
}

export function changeDateFormat(date) {
  const months = {
      "01": "Ene",
      "02": "Feb",
      "03": "Mar",
      "04": "Abr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Ago",
      "09": "Sep",
      "10": "Oct",
      "11": "Nov",
      "12": "Dic"
    }

  return months[date.substring(5,7)] + " " + date.substring(0,4);
}

export function applyFilters(data, filters, type) {
  let filteredResults = [];
  const options = {
    "sales": {
      "selectedBook": {
        "data" : (sale) => sale.inventory.book.title,
        "filter": filters.selectedBook,
        "function": (data, filter) => data !== filter
      },
      "selectedBookstore": {
        "data": (sale) => sale.inventory.bookstore.name,
        "filter": filters.selectedBookstore,
        "function": (data, filter) => data !== filter
      },
      "selectedAuthor": {
        "data": (sale) => sale.authorsString,
        "filter": filters.selectedAuthor,
        "function": (data, filter) => !data.includes(filter)
      }
    },
    "kindle": {
      "selectedBook": {
        "data" : (sale) => sale.book.title,
        "filter": filters.selectedBook,
        "function": (data, filter) => data !== filter
      },
      "selectedAuthor": {
        "data": (sale) => sale.authorsString,
        "filter": filters.selectedAuthor,
        "function": (data, filter) => !data.includes(filter)
      }
    }
  }
  let activeFilters = [];
  for (const element of Object.entries(filters)) {
    if (element[1] !== "") {
      activeFilters.push(element[0])
    }
  }

  for (const sale of data) {
    if (activeFilters.length === 0) {
      filteredResults = data
      break;
    }

    let retained = true
    for (const filter of activeFilters) {
      const data = options[type][filter].data(sale)
      const filterValue = options[type][filter].filter
      if (options[type][filter].function(data, filterValue)) {
        retained = false;
        break;
      }
    }
    if (retained) {
      filteredResults.push(sale)
    }
  }
  
  return filteredResults
}

export function getAuthorString(userList) {
  let authorString = "";
  for (let i = 0; i < userList.length; i++) {
    authorString += userList[i].first_name + " " + userList[i].last_name
    if (i < userList.length - 1) {
      userList.authorsString += ", ";
    }
  }
  return authorString
}