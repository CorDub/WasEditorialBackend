import { validateInput } from './validations.js';

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
      res = ((price - (price * storeCutPercent / 100)) * quantity)
    }

    if (res < 0.001) {
      res = 0
    }

    return res
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
      userList.authorsString += ", ";
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