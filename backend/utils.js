import { validateInput } from './validations.js';

export function calculateAuthorRevenue(
  category_type,
  price,
  deal_percentage,
  bookstoreId,
  percentage_royalties,
  rebate_author,
  percentage_management_stores,
  management_min,
  quantity,
) {
  let res = 0;
  const priceInCents = price * 100

  if (category_type === "comissions") {
    if (bookstoreId !== 1) {
      const percentTotal = deal_percentage + percentage_management_stores;
      const remaining = priceInCents - (priceInCents * (percentTotal / 100))
      const totalInCents = Math.round(remaining * quantity)
      const total  = totalInCents / 100
      // res = Number((remaining * quantity).toFixed(2))
      res = total
    } else {
      let gestionWas = priceInCents * (deal_percentage / 100)
      const managementMinInCents = management_min * 100
      if (gestionWas < managementMinInCents) {
        gestionWas = managementMinInCents
      }
      const finalReturn = priceInCents - gestionWas
      const totalInCents = Math.round(finalReturn * quantity)
      const total  = totalInCents / 100
      // res = Number((finalReturn * quantity).toFixed(2))
      res = total
    }
  } else if (category_type === "regalias") {
    const remaining = priceInCents * (percentage_royalties / 100)
    const totalInCents = Math.round(remaining * quantity)
    const total  = totalInCents / 100
    // res = Number((remaining * quantity).toFixed(2))
    res = total
  }

  return res;
}

export function calculateBookstoreComission(
  category_type,
  price,
  deal_percentage,
  bookstoreId,
  percentage_royalties,
  percentage_management_stores,
  management_min
) {
  let res = 0;
  const priceInCents = price * 100

  if (category_type === "comissions") {
    if (bookstoreId !== 1) {
      const percentTotal = deal_percentage + percentage_management_stores;
      const bookstoreCom = (priceInCents * (percentTotal / 100))
      // res = Number(bookstoreCom.toFixed(2))
      res = bookstoreCom / 100
    } else {
      let gestionWas = (priceInCents * (deal_percentage / 100))
      const managementMinInCents = management_min * 100
      if (gestionWas < managementMinInCents) {
        gestionWas = managementMinInCents
      }
      // res = Number(gestionWas.toFixed(2))
      res = gestionWas / 100
    }

  } else if (category_type === "regalias") {
    const percentageBookstore = (100 - percentage_royalties)
    const remaining = (priceInCents * (percentageBookstore / 100))
    // res = Number(remaining.toFixed(2))
    res = remaining / 100
  }

  return res;
}

export function roundToSecondDecimal(float) {
  return Number(float.toFixed(2))
}

export function getForMonth(timestamp) {
  const date = new Date(timestamp);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const forMonth = year + "-" + month
  return forMonth
}

export function getForMonthStr(dateStr) {
  return dateStr.substring(0,7)
}

export function convertISOString(date, separator='-') {
  let JsonParsedDate = JSON.stringify(date);
  const justDateNoTime = JsonParsedDate.split("T")[0]
  const cleanedDate = justDateNoTime.split('"')[1]
  let finalDate = cleanedDate;
  if (separator !== '-') {
    finalDate = cleanedDate.replace(/-/g, "/")
  }
  return finalDate
}

export function generateMonthKeysForRange(startDate, endDate) {
  const startString = convertISOString(startDate);
  const endString = convertISOString(endDate);

  const start = startString.substring(0,7);
  const end = endString.substring(0,7);

  let numMonthsInRange = 0;
  if (start.substring(0,4) === end.substring(0,4)) {
    numMonthsInRange = Number(end.substring(5,7)) - Number(start.substring(5,7));
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

export function generateMonthKeysForRangeStr(startDate, endDate) {
  // const startString = convertISOString(startDate);
  // const endString = convertISOString(endDate);

  // const start = startString.substring(0,7);
  // const end = endString.substring(0,7);

  let numMonthsInRange = 0;
  if (startDate.substring(0,4) === endDate.substring(0,4)) {
    numMonthsInRange = Number(endDate.substring(5,7)) - Number(startDate.substring(5,7));
  } else {
    numMonthsInRange = Number(endDate.substring(5,7))
      + (Number(endDate.substring(0,4)) - Number(startDate.substring(0,4))) * 12
      - Number(startDate.substring(5,7))
  }

  let monthKeysInRange = []
  for (let i = 0; i <= numMonthsInRange; i++) {
    const month = (Number(startDate.substring(5,7)) + i) - (12 * Math.trunc((Number(startDate.substring(5,7)) + i -1)/12))
    const year = Number(startDate.substring(0,4)) + (Math.trunc((Number(startDate.substring(5,7)) + i - 1) / 12))
    const monthKey = String(year) + "-" + String(month).padStart(2, "0");
    monthKeysInRange.push(monthKey)
  }

  return monthKeysInRange
}

export function twelveMonthsAgo() {
  const now = new Date();
  const result = new Date(now);

  result.setMonth(result.getMonth() - 12);

  return result;
}

export function localISODateTwelveMonthsAgo() {
  const d = new Date();          // local now
  d.setMonth(d.getMonth() - 12); // local month arithmetic
  d.setHours(0, 0, 0, 0);        // normalize to start of local day

  const pad = n => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toLocalISODate(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function changeDateFormat(date, format='normal') {
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

    const fullMonths = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre"
    }

  if (format === "monthOnly") {
    return months[date.substring(5,7)];
  } else if (format === "fullMonths") {
    return fullMonths[date.substring(5,7)];
  } else if (format === "fullDate") {
    return date.substring(8,10) + " " + months[date.substring(5,7)] + " " + date.substring(0,4);
  } else if (format === "yearFirst") {
    return date.substring(0,4) + "-" + date.substring(5,7) + "-" + date.substring(8,10);
  } else if (format === "dayFirst") {
    return date.substring(8, 10) + "/" + date.substring(5,7) + "/" + date.substring(0,4);
  } else if (format === "yearFirstSlash") {
    return date.substring(0,4) + "/" + date.substring(5,7) + "/" + date.substring(8,10);
  }

  return months[date.substring(5,7)] + " " + date.substring(0,4);
}


export function applyFilters(data, filters, type) {
  let filteredResults = [];
  // getting all our paths + functions listed
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

  // getting the list of active filters to not filter by inactive
  let activeFilters = [];
  for (const element of Object.entries(filters)) {
    if (element[1] !== "") {
      activeFilters.push(element[0])
    }
  }

  // filtering
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
      authorString += ", ";
    }
  }
  return authorString
}

export function isForMonthNextMonth(forMonth1, forMonth2) {
  const yearForMonth1 = parseInt(forMonth1.substring(0,4));
  const yearForMonth2 = parseInt(forMonth2.substring(0,4));
  const monthForMonth1 = parseInt(forMonth1.substring(5,7));
  const monthForMonth2 = parseInt(forMonth2.substring(5,7));

  if (monthForMonth2 === 12) {
    if (monthForMonth1 !== 1) {
      return false
    }

    if (yearForMonth1 === yearForMonth2 + 1) {
      return true
    } else {
      return false
    }
  }

  if (yearForMonth1 !== yearForMonth2) {
    return false
  }

  if (monthForMonth1 !== monthForMonth2 + 1) {
    return false
  }

  return true;
}

export function convertDateStringToLocalFormat(dateString) {
  const dateOnly = dateString.split(",");
  const dateComponents = dateOnly[0].split("/");

  for (let i = 0; i < dateComponents.length; i++) {
    if (dateComponents[i].length === 1) {
      dateComponents[i] = "0" + dateComponents[i]
    }
  }

  return dateComponents[1] + "/"  + dateComponents[0] + "/" + dateComponents[2]
}

export function validateInputs(inputObject) {
  for (const [inputName, inputValue] of Object.entries(inputObject)) {
    const error = validateInput(inputName, inputValue);
    if (error.length > 0) {
      throw new Error (`invalid input ${error[0]}`)
    }
  }
}

export function getForMonthDate(date) {
  const completeDate = forMonth + "-01"
  const inDateTime = new Date(completeDate);
  const toUTC = inDateTime.toISOString()
  return toUTC
}

export function putDateAtNoon(date) {
  const newDate = new Date(date)
  newDate.setHours(12)
  newDate.setMinutes(0)
  newDate.setSeconds(0)
  return newDate
}

export function avoidTimeshift(strDate) {
  const year = Number(strDate.substring(0,4))
  const month = Number(strDate.substring(5,7)) - 1
  const day = Number(strDate.substring(8,10))
  const res = new Date(Date.UTC(year, month, day, 12, 0, 0))
  return res
}

// export function mexicoDate(ingressDate, period) {
//   let date;
//   if (period === "start") {
//     date = DateTime
//     .fromISO(ingressDate.toISOString(), {zone:"America/Mexico_City"})
//     .startOf("day")
//     .toUTC()
//     .toJSDate();
//   } else if (period === "end") {
//     date = DateTime
//     .fromISO(ingressDate.toISOString(), {zone:"America/Mexico_City"})
//     .endOf("day")
//     .toUTC()
//     .toJSDate();
//   // } else if (period === "midday") {
//   //   date = DateTime
//   //   .fromFormat(ingressDate, "yyyy-MM-dd", {zone:"America/Mexico_City"})
//   //   .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
//   //   .toUTC()
//   //   .toJSDate();
//   } else if (period === "midday") {
//     date = DateTime
//     .fromISO(ingressDate, { zone: "utc" })
//     .setZone("America/Mexico_City")
//     .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
//     .toUTC()
//     .toJSDate();
//   }

//   return date
// }

export function today() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateCutStr(dateStr) {
  const month = Number(dateStr.substring(5,7))
  const dateCutDay = Number(dateStr.substring(8,10)) > 28 ? 28 : Number(dateStr.substring(8,10))
  const paddedDateCutDay = String(dateCutDay).padStart(2, "0")

  if (month > 12) {
    console.error(`Not a correct month number (1-12): ${month}`)
    return
  } else if (month > 2) {
    const dateCutMonth = month - 2
    return `${dateStr.substring(0,4) + "-" + String(dateCutMonth).padStart(2, "0") + "-" + paddedDateCutDay}`
  } else {
    const dateCutYear = Number(dateStr.substring(0,4)) - 1;
    const overspill = Math.abs(month - 2);
    const dateCutMonth = 12 - overspill;
    return `${dateCutYear + "-" + dateCutMonth + "-" + paddedDateCutDay}`
  }
}