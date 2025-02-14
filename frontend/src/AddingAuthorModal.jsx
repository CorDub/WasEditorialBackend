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
  const countrySelect = document.getElementById("country-select");
  const [categories, setCategories] = useState([]);
  const categorySelect = document.getElementById("category-select");
  const [errors, setErrors] = useState([]);

  async function sendToServer(e) {
    e.preventDefault();

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
          category: category
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear un nuevo autor.');
        closeAddingModal(pageIndex, globalFilter);
      } else {
        const data = await response.json();
        alert(`Un nuevo author ${data.name} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  function countryChange(e) {
    if (e.target.value === "null") {
      setCountry(null);
      if (countrySelect.classList.contains("selected") === true) {
        countrySelect.classList.remove("selected")
      };
    } else {
      setCountry(e.target.value);
      if (countrySelect.classList.contains("selected") === false) {
        countrySelect.classList.add("selected")
      };
    };
  }

  function categoryChange(e) {
    if (e.target.value === "null") {
      setCategory(null);
      if (categorySelect.classList.contains("selected") === true) {
        categorySelect.classList.remove("selected")
      };
    } else {
      setCategory(e.target.value);
      if (categorySelect.classList.contains("selected") === false) {
        categorySelect.classList.add("selected")
      };
    };
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

  function checkForErrors() {
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
      if (!inputFirstName.classList.contains("error")) {
        inputFirstName.classList.add("error");
      };
    };

    if (firstName.length > 50) {
      errorList.push(12);
      if (!inputFirstName.classList.contains("error")) {
        inputFirstName.classList.add("error");
      };
    };

    // if (lastName === '') {
    //   errorList.push(21);
    //   if (!inputFirstName.classList.contains("error")) {
    //     inputLastName.classList.add("error");
    //   };
    // };

    if (lastName.length > 50) {
      errorList.push(22);
      if (!inputLastName.classList.contains("error")) {
        inputLastName.classList.add("error");
      };
    };

    if (country === null) {
      errorList.push(31);
      if (!inputCountry.classList.contains("error")) {
        inputCountry.classList.add("error");
      };
    };

    if (!countries.includes(country)) {
      errorList.push(32);
      if (!inputCountry.classList.contains("error")) {
        inputCountry.classList.add("error");
      };
    };

    if (referido.length > 100) {
      errorList.push(41);
      if (!inputReferido.classList.contains("error")) {
        inputReferido.classList.add("error");
      };
    };

    if (email === '') {
      errorList.push(51);
      if (!inputEmail.classList.contains("error")) {
        inputEmail.classList.add("error");
      };
    };

    if (email.length > 50) {
      errorList.push(52);
      if (!inputEmail.classList.contains("error")) {
        inputEmail.classList.add("error");
      };
    };

    if (category === null) {
      errorList.push(61);
      if (!inputCategory.classList.contains("error")) {
        inputCategory.classList.add("error");
      };
    };

    if (!categories.includes(category)) {
      console.log(typeof categories[0]);
      console.log(typeof category);
      console.log(!categories.includes(category))
      errorList.push(62);
      if (!inputCategory.classList.contains("error")) {
        inputCategory.classList.add("error");
      };
    };

    console.log(errorList)
    setErrors(errorList);
    return errorList;
  }

  useEffect(()=> {
    console.log(categories)
    console.log(country);
    console.log(typeof category);
  }, [categories, country, category])

  async function handleSubmit(e) {
    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }

    sendToServer(e)
  }

  useEffect(() => {
    fetchCategoryTypes();
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
          onChange={(e) => countryChange(e)} >
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
          onChange={(e) => categoryChange(e)}>
          <option value="null">Categoría</option>
          {categories && categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </select>
        <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={closeAddingModal}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingAuthorModal;
