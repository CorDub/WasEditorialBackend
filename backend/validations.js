export function validateInput(inputName, inputValue) {
  let errors = [];

  const possibleChecks = {
    "firstName": [
      ["presence", "not empty"],
      ["type", "string"],
      ["length", 50]
    ], 
    "lastName": [
      ["presence", "not empty"],
      ["type", "string"],
      ["length", 50]
    ],
    "country": [
      ["type", "string"],
      ["value", [
    "México", "Estados Unidos",
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán",
    "Bahamas", "Bangladés", "Baréin", "Barbados", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Bélgica",
    "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba",
    "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini (Suazilandia)", "Etiopía",
    "Filipinas", "Finlandia", "Fiyi", "Francia",
    "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana",
    "Haití", "Honduras", "Hungría",
    "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
    "Jamaica", "Japón", "Jordania",
    "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait",
    "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
    "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique",
    "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda",
    "Omán",
    "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia",
    "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
    "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu",
    "Ucrania", "Uganda", "Uruguay", "Uzbekistán",
    "Vanuatu", "Vaticano", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabue"
  ]]
    ],
    "email": [
      ["type", "string"],
      ["format", "email"],
      ["length", 255]
    ],
    "role": [
      ["presence", "not empty"],
      ["type", "string"],
      ["value", ["admin", "superadmin"]],
    ],
    "referido": [
      ["type", "string"],
      ["length", 255]
    ],
    "phone": [
      ["type", "string"],
      ["format", 'phone']
    ],
    "category": [
      ["type", "number"],
    ],
    "isbn": [
      ["type", "string or null"],
      ["format", "isbn"]
    ],
    "title": [
      ["presence", "not empty"],
      ["type", "string"],
      ["length", 255],
    ],
    "pasta": [
      ["type", "string"],
      ["length", 10],
      ["value", ["Blanda", "Dura"]],
    ],
    "price": [
      ["presence", "not empty"],
      ["type", "number"],
      ["range", "positive"]
    ],
    "quantity": [
      ["presence", "not empty"],
      ["type", "number"],
      ["range", "positive"]
    ],
    "quantityEbook": [
      ["type", "number"],
      ["range", "positive"]
    ],
    "quantityPod": [
      ["type", "number"],
      ["range", "positive"]
    ],
    "id": [
      ["presence", "not empty"],
      ["type", "number"],
    ],
    "inventoryId": [
      ["presence", "not empty"],
      ["type", "number"],
    ],
    "bookId": [
      ["presence", "not empty"],
      ["type", "number"],
    ],
    "bookstoreId": [
      ["presence", "not empty"],
      ["type", "number"],
    ],
    "birthday": [
      ["type", "string"],
      ["exactLength", 8],
      ["format", "birthday"]
    ],
    "name": [
      ["presence", "not empty"],
      ["type", "string"],
      ["length", 50]
    ],
    "dealPercentage": [
      ["type", "number"],
      ["maximum", 100],
      ["minimum", 0]
    ],
    "comissions": [
      ["type", "boolean"],
    ],
    "contactName": [
      ["type", "string"],
      ["length", 255]
    ],
    "categoryType": [
      ['presence', 'not empty'],
      ['type', 'string'],
      ['value', ["comissions", "regalias"]]
    ],
    "categoryId": [
      ['presence', 'not empty'],
      ['type', 'number']
    ],
    "gestionMinima": [
      ["type", "number"],
      ["range", "positive"],
    ], 
    "gestionTiendas": [
      ["type", "number or null"],
      ["range", "positive"],
      ["maximum", 100]
    ],
    "date": [
      ["type", "datetime"],
      ["timerange", "no future"]
    ],
    "dateCut": [
      ['presence', 'not empty'],
      ["type", "datetime"],
      ["timerange", "no future"]
    ],
    "datePay": [
      ['presence', 'not empty'],
      ["type", "datetime"],
      ["timerange", "no future"]
    ],
    "regalias": [
      ['presence', 'not empty'],
      ['type', 'number'],
      ['range', 'positive'],
      ['maximum', 100]
    ],
    "paymentId": [
      ['type', 'number or null'],
    ], 
    "amount": [
      ['presence', 'not empty'],
      ['type', 'number'],
      ['range', 'positive'],
    ],
    'note': [
      ['type', 'string or null'],
      ['length', 255]
    ],
    'clabe': [
      ['type', 'string'],
      ['format', 'clabe']
    ],
    "name_bank_account": [
      ['type', 'string'],
      ['length', 255]
    ],
    "bank": [
      ['type', "string"],
      ['length', 255]
    ],
    "swift": [
      ['type', 'string'],
      ['format', 'swift']
    ],
    "inicial": [
      ["presence", "not empty"],
      ['type', "number"],
      ["range", "positive"],
    ],
    "startDate": [
      ['presence', 'not empty'],
      ["type", "datetime"],
      ["timerange", "no future"]
    ],
    "endDate": [
      ['presence', 'not empty'],
      ["type", "datetime"],
      ["timerange", "no future"]
    ],
    "bookstoreToId": [
      ['type', 'number or null']
    ],
    'bookstoreFromId': [
      ['presence', 'not empty'],
      ['type', 'number']
    ],
    'inventoryFromId': [
      ['presence', 'not empty'],
      ['type', 'number']
    ],
    'type': [
      ['type', 'string'],
      ['value', ['send', 'return', ]]
    ],
    "deliveryDate": [
      ["type", "datetime or null"],
      ["timerange", "no future"]
    ],
    "place": [
      ["type", "string or null"],
      ["length", 255]
    ],
    "person": [
      ["type", "string or null"],
      ["length", 255]
    ],
    "status": [
      ["presence", "not empty"],
      ["value", ["solicited", "created", "paid"]]
    ],
    "password": [
      ["presence", "not empty"],
      ['type', "string"],
      ["length", 25]
    ], 
    "month": [
      ["type", "string"],
      ["type", "string"],
    ],
    "monthOriginal": [
      ["type", "string"],
      ["length", 7],
    ],
    "factura": [
      ["presence", "not empty"],
      ["type", "file"],
      ["size", 5*1024*1024]
    ],
    "constancia": [
      ["presence", "not empty"],
      ["type", "file"],
      ["size", 5*1024*1024]
    ], 
    "number": [
      ['presence', "not empty"],
      ["type", "number"],
      ["range", "positive"]
    ],
    "rebate": [
      ["type", "number"],
      ["range", "positive"],
      ["maximum", 100]
    ]
  }

  for (const check of possibleChecks[inputName]) {
    switch (check[0]) {
      case "type":
        if (check[1] === "string") {
          if (typeof inputValue !== "string") {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "string or null") {
          if (typeof inputValue !== 'string' && inputValue !== null) {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "number") {
          if (typeof inputValue !== 'number' || !Number.isFinite(inputValue)) {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "number or null") {
          if (inputValue !== null) {
            if (typeof inputValue !== 'number' || !Number.isFinite(inputValue)) {
              errors.push([inputName, inputValue, "type"]);
              return errors
            }
          }
        }

        if (check[1] === "boolean") {
          if (typeof inputValue !== "boolean") {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "datetime") {
          if (!(inputValue instanceof Date)) {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }

          if (isNaN(inputValue)) {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "datetime or null") {
          if (inputValue !== null) {
            if (!(inputValue instanceof Date)) {
              errors.push([inputName, inputValue, "type"]);
              return errors
            }

            if (isNaN(inputValue)) {
              errors.push([inputName, inputValue, "type"]);
              return errors
            }
          }
        }

        if (check[1] === "file") {
          if (inputValue.mimetype !== "application/pdf"
            && inputValue.mimetype !== "image/jpeg"
            && inputValue.mimetype !== "image/png"
          ) {
            errors.push([inputName, inputValue, "type"]);
            return errors
          }
        }
      break;

      case "presence": 
        if (check[1] === "not empty") {
          if (inputValue === "" 
            || inputValue === null
            || inputValue === undefined
          ) {
            errors.push([inputName, inputValue, "presence"]);
            return errors
          }
        } 
      break;

      case "length":
        if (inputValue && inputValue.length > check[1]) {
          errors.push([inputName, inputValue, "length"])
          return errors
        }
      break;

      case "exactLength":
        if (inputValue.length !== check[1]) {
          errors.push([inputName, inputValue, 'exactLength'])
          return errors
        }
      break;

      case "format":
        if (check[1] === "email") {
          if (inputValue === "") {
            continue;
          }

          const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!validEmailRegex.test(inputValue)) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "phone") {
          if (inputValue === "") {
            continue;
          }

          const validPhoneRegex = /^(?:00\d{14,15}|\d{10})$/;
          if (!validPhoneRegex.test(inputValue)) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "isbn") {
          if (inputValue === "" || inputValue === null) {
            continue;
          }

          const validISBNRegex = /^(?:(?:\d{9}[\dX])|(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dX])|(?:(?:978|979)\d{10})|(?:(?:978|979)-\d{1,5}-\d{1,7}-\d{1,7}-\d))$/;
          if (!validISBNRegex.test(inputValue)) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "birthday") {
          if (inputValue === "") {
            continue;
          }

          if (parseInt(inputValue.substring(0,2)) > 31 || parseInt(inputValue.substring(0,2)) < 1) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }

          if (parseInt(inputValue.substring(2,4)) > 12 || parseInt(inputValue.substring(2,4)) < 1) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }

          if (parseInt(inputValue.substring(4,8)) > (new Date().getFullYear()) || parseInt(inputValue.substring(4,8)) < (new Date().getFullYear()) - 100) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "clabe") {
          if (inputValue === "") {
            continue;
          }

          const validClabeRegex = /^\s*\d{3}[-\s]?\d{3}[-\s]?\d{11}[-\s]?\d{1}\s*$/
          if (!validClabeRegex.test(inputValue)) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "swift") {
          if (inputValue === "") {
            continue;
          }

          const validSwiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/
          if (!validSwiftRegex.test(inputValue)) {
            errors.push([inputName, inputValue, "format"])
            return errors
          }
        }
      break;

      case "value":
        if (!check[1].includes(inputValue)) {
          errors.push([inputName, inputValue, "value"])
          return errors
        }
      break;

      case "maximum":
        if (inputValue > check[1]) {
          errors.push([inputName, inputValue, "maximum"])
          return errors
        }
      break;

      case "minimum":
        if (inputValue < check[1]) {
          errors.push([inputName, inputValue, "minimum"])
          return errors
        }
      break;

      // case "timerange":
      //   if (check[1] === "no future") {
      //     if (inputValue > new Date()) {
      //       errors.push([inputName, inputValue, "timerange"])
      //       return errors
      //     }
      //   }
      // break;

      case "range":
        if (check[1] === "positive") {
          if (inputValue < 0) {
            errors.push([inputName, inputValue, "range"])
            return errors
          }
        } 
      break;

      case "size": 
        if (inputValue?.size > check[1]) {
          errors.push([inputName, inputValue, "size"])
          return errors
        }
      break;
    }
  }

  return errors;
}