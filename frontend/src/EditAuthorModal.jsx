import { useEffect, useState } from "react";
import useCheckUser from "./useCheckUser";
import AddingAuthorModalErrors from "./AddingAuthorModalErrors";

function EditAuthorModal({ row, closeEditModal, pageIndex, globalFilter }) {
  useCheckUser();

  const [firstName, setFirstName] = useState(row.first_name);
  const [lastName, setLastName] = useState(row.last_name);
  const [country, setCountry] = useState(row.country);
  const [referido, setReferido] = useState(row.referido ? row.referido : "");
  const [email, setEmail] = useState(row.email ? row.email : "");
  const [category, setCategory] = useState(row.category ? row.category.type : "");
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
  const [categories, setCategories] = useState([]);

  async function editAuthor(e) {
    let fullCategory = {};
    categories.map((cat) => {
      if (cat.type === parseInt(category)) {
        fullCategory = cat;
        return;
      }
    });
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/admin/user', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          first_name: firstName,
          last_name: lastName,
          country: country,
          referido: referido,
          email: email,
          categoryId: fullCategory.id
        })
      });

      if (response.ok === true) {
        const alertMessage = (`Actualizado ${firstName} ${lastName} con exito`);
        closeEditModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
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

  async function handleSubmit(e) {
    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }
    editAuthor(e)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <div className="form-title">
          <p>Editar autor</p>
        </div>
        <form className="global-form">
          <input type="text" value={`${firstName}`}
            className="global-input" id='adding-author-first-name'
            onChange={(e)=>setFirstName(e.target.value)}></input>
          <input type="text" value={`${lastName}`}
            className="global-input" id="adding-author-last-name"
            onChange={(e)=>setLastName(e.target.value)}></input>
          <select className="select-global"
            id="country-select"
            onChange={(e) => dropDownChange(e, "Country")} >
            <option value={`${country}`}>{country}</option>
            {countries.map((country, index) => (
              <option key={index} value={country}>{country}</option>
            ))}
          </select>
          <input type="text" value={`${referido}`}
            className="global-input" id="adding-author-referido"
            onChange={(e)=>setReferido(e.target.value)}></input>
          <input type="text" value={`${email}`}
            className="global-input" id="adding-author-email"
            onChange={(e)=>setEmail(e.target.value)}></input>
          <select className="select-global" id="category-select"
            onChange={(e) => dropDownChange(e, "Category")}>
            <option value={category}>{category}</option>
            {categories && categories.map((cat, index) => (
              <option key={index} value={cat.type}>{cat.type}</option>
            ))}
          </select>
        </form>
        <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/>
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={() => closeEditModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={handleSubmit}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default EditAuthorModal;
