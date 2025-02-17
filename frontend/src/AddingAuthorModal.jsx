import { useEffect, useState } from 'react';
import useCheckUser from './useCheckUser';
import AddingAuthorModalErrors from './AddingAuthorModalErrors.jsx';

function AddingAuthorModal({ closeAddingModal, pageIndex, globalFilter }) {
  useCheckUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState(null);
  const [referido, setReferido] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(null);
  const countries = [
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
  ];
  const [errors, setErrors] = useState([]);
  const [categories, setCategories] = useState(null);

  async function sendToServer(e) {
    e.preventDefault();
    let fullCategory = {};
    categories.map((cat) => {
      if (cat.type === parseInt(category)) {
        fullCategory = cat;
        return;
      }
    });

    try {
      const response = await fetch('http://localhost:3000/admin/user', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          country: country,
          referido: referido,
          email: email,
          category: fullCategory.id
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          checkForErrors(error.message);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo autor.';
        closeAddingModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un(a) nuev(o.a) autor(a) ${data.firstName} ${data.lastName} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`;
        closeAddingModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function dropDownChange(e, input_name) {
    const inputs = {
      "Category": {
        "function": setCategory,
        "element": document.getElementById("category-select")
      },
      "Country": {
        "function": setCountry,
        "element": document.getElementById("country-select")
      }
    }

    if (e.target.value === "null") {
      inputs[input_name]["function"](null);
      if (inputs[input_name]["element"].classList.contains("selected") === true) {
        inputs[input_name]["element"].classList.remove("selected")
      };
    } else {
      inputs[input_name]["function"](e.target.value);
      if (inputs[input_name]["element"].classList.contains("selected") === false) {
        inputs[input_name]["element"].classList.add("selected")
      };
    };
  }

  function checkForErrors(serverError) {
    function addErrorClass(input_name) {
      if (!input_name.classList.contains("error")) {
        input_name.classList.add("error");
      };
    }

    let errorList = [];
    const inputFirstName = document.getElementById('adding-author-first-name');
    const inputLastName = document.getElementById('adding-author-last-name');
    const inputCountry = document.getElementById('country-select');
    const inputReferido = document.getElementById('adding-author-referido');
    const inputEmail = document.getElementById('adding-author-email');
    const inputCategory = document.getElementById('category-select');
    const inputsList = [inputFirstName, inputLastName, inputCountry,
      inputReferido, inputEmail, inputCategory];

    inputsList.forEach((input) => {
      if (input.classList.contains("error")) {
        input.classList.remove("error");
      }
    })

    if (firstName === '') {
      errorList.push(11);
      addErrorClass(inputFirstName);
    };

    if (firstName.length > 50) {
      errorList.push(12);
      addErrorClass(inputFirstName);
    };

    if (lastName.length > 50) {
      errorList.push(22);
      addErrorClass(inputLastName);
    };

    if (serverError === "Un autor con el mismo nombre completo ya existe") {
      errorList.push(121);
      addErrorClass(inputFirstName);
      addErrorClass(inputLastName);
    }

    if (country === null) {
      errorList.push(31);
      addErrorClass(inputCountry);
    };

    if (!countries.includes(country)) {
      errorList.push(32);
      addErrorClass(inputCountry);
    };

    if (referido.length > 100) {
      errorList.push(41);
      addErrorClass(inputReferido);
    };

    if (email === '') {
      errorList.push(51);
      addErrorClass(inputEmail);
    };

    if (email.length > 50) {
      errorList.push(52);
      addErrorClass(inputEmail);
    };

    if (serverError === "El correo ya está usado") {
      errorList.push(53);
      addErrorClass(inputEmail);
    }

    if (category === null) {
      errorList.push(61);
      addErrorClass(inputCategory);
    };

    const categories_types = [];
    categories.map((cat) => {
      categories_types.push(cat.type)
    });
    if (!categories_types.includes(parseInt(category))) {
      errorList.push(62);
      addErrorClass(inputCategory);
    };

    setErrors(errorList);
    return errorList;
  }

  async function handleSubmit(e) {
    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }
    sendToServer(e)
  }

  async function fetchCategoryTypes() {
    try {
      const response = await fetch('http://localhost:3000/admin/categories-type', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataCategories = await response.json();
        setCategories(dataCategories);
      } else {
        console.log("There was an error fetching categories:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching categories:", error);
    }
  }

  useEffect(() => {
    fetchCategoryTypes()
  }, [])

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo autor</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre"
          className="global-input" id='adding-author-first-name'
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido"
          className="global-input" id="adding-author-last-name"
          onChange={(e) => setLastName(e.target.value)}></input>
        <select className="select-global"
          id="country-select"
          onChange={(e) => dropDownChange(e, "Country")} >
          <option value="null">País</option>
          {countries.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
        <input type='text' placeholder="Referido (opcional)"
          className="global-input" id="adding-author-referido"
          onChange={(e) => setReferido(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          className="global-input" id="adding-author-email"
          onChange={(e) => setEmail(e.target.value)}></input>
        <select className="select-global" id="category-select"
          onChange={(e) => dropDownChange(e, "Category")}>
          <option value="null">Categoría</option>
          {categories && categories.map((category, index) => (
            <option key={index} value={category.type}>{category.type}</option>
          ))}
        </select>
        <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeAddingModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingAuthorModal;
