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
      ["length", 100]
    ],
    "phone": [
      ["type", "number"],
      ["presence", 'not empty'],
      ["format", 'phone']
    ],
    "category": [
      ["type", "number"],
      ['length', 1]
    ],
    "isbn": [
      ["type", "number"],
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
    ],
    "quantity": [
      ["presence", "not empty"],
      ["type", "number"],
      ["length", 5],
    ],
    "id": [
      ["presence", "not empty"],
      ["type", "number"],
    ],
    "birthday": [
      ["type", "number"],
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
  }

  for (const check of possibleChecks[inputName]) {
    switch (check[0]) {
      case "type":
        if (check[1] === "string") {
          if (typeof inputValue !== "string") {
            errors.push([inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "number") {
          if (!Number.isFinite(parseInt(inputValue))) {
            errors.push([inputValue, "type"]);
            return errors
          }
        }

        if (check[1] === "boolean") {
          if (typeof inputValue !== "boolean") {
            errors.push([inputValue, "type"]);
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
            errors.push([inputValue, "presence"]);
            return errors
          }
        } 
      break;

      case "length":
        if (inputValue.length > check[1]) {
          errors.push([inputValue, "length"])
          return errors
        }
      break;

      case "exactLength":
        if (inputValue.length !== check[1]) {
          errors.push([inputValue, 'exactLength'])
          return errors
        }
      break;

      case "format":
        if (check[1] === "email") {
          const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!validEmailRegex.test(inputValue)) {
            errors.push([inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "phone") {
          const validPhoneRegex = /^(?:00\d{14,15}|\d{10})$/;
          if (!validPhoneRegex.test(inputValue)) {
            errors.push([inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "isbn") {
          const validISBNRegex = /^(?:(?:\d{9}[\dX])|(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dX])|(?:(?:978|979)\d{10})|(?:(?:978|979)-\d{1,5}-\d{1,7}-\d{1,7}-\d))$/;
          if (!validISBNRegex.test(inputValue)) {
            errors.push([inputValue, "format"])
            return errors
          }
        }

        if (check[1] === "birthday") {
          if (parseInt(inputValue.substring(0,2)) > 31 || parseInt(inputValue.substring(0,2)) < 1) {
            errors.push([inputValue, "format"])
            return errors
          }

          if (parseInt(inputValue.substring(2,4)) > 12 || parseInt(inputValue.substring(2,4)) < 1) {
            errors.push([inputValue, "format"])
            return errors
          }

          if (parseInt(inputValue.substring(4,8)) > (new Date().getFullYear()) || parseInt(inputValue.substring(4,8)) < (new Date().getFullYear()) - 100) {
            errors.push([inputValue, "format"])
            return errors
          }
        }
      break;

      case "value":
        if (!check[1].includes(inputValue)) {
          errors.push([inputValue, "value"])
          return errors
        }
      break;

      case "maximum":
        if (inputValue > check[1]) {
          errors.push([inputValue, "maximum"])
          return errors
        }
      break;

      case "minimum":
        if (inputValue < check[1]) {
          errors.push([inputValue, "minimum"])
          return errors
        }
      break;
    }
  }

  return errors;
}