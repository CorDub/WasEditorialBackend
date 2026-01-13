import { useEffect, useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin.jsx';
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingAuthorModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referido, setReferido] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const referidoRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const dayRef = useRef();
  const monthRef = useRef();
  const yearRef = useRef();
  const [errors, setErrors] = useState([]);

  useEffect(() => { 
    setBirthday(day.padStart(2, "0") + month.padStart(2, "0") + year)
  }, [day, month, year])

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/user`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          referido: referido,
          email: email,
          phone: phone,
          birthday: birthday,
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          checkForServerErrors(error.message);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo autor.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un(a) nuev(o.a) autor(a) ${data.firstName} ${data.lastName} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se le ha sido enviado por correo.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  // function dropDownChange(e, input_name) {
  //   const inputs = {
  //     "Category": {
  //       "function": setCategory,
  //       "element": document.getElementById("category-select")
  //     },
  //     "Country": {
  //       "function": setCountry,
  //       "element": document.getElementById("country-select")
  //     }
  //   }

  //   if (e.target.value === "null") {
  //     inputs[input_name]["function"](null);
  //     if (inputs[input_name]["element"].classList.contains("selected") === true) {
  //       inputs[input_name]["element"].classList.remove("selected")
  //     };
  //   } else {
  //     inputs[input_name]["function"](e.target.value);
  //     if (inputs[input_name]["element"].classList.contains("selected") === false) {
  //       inputs[input_name]["element"].classList.add("selected")
  //     };
  //   };
  // }

  function checkForServerErrors(serverError) {
    function addErrorClass(input_name) {
      if (!input_name.classList.contains("error-inputs")) {
        input_name.classList.add("error-inputs");
      };
    }

    let errorList = [];
    const inputFirstName = document.getElementById('adding-author-first-name');
    const inputLastName = document.getElementById('adding-author-last-name');
    const inputEmail = document.getElementById('adding-author-email');
    if (serverError === "Un autor con el mismo nombre completo ya existe" 
      || serverError === "Este usuario ya existe"
    ) {
      errorList.push(serverError);
      addErrorClass(inputFirstName);
      addErrorClass(inputLastName);
    }

    if (serverError === "El correo ya está usado") {
      errorList.push(serverError);
      addErrorClass(inputEmail);
    }

    setErrors(errorList);
    return errorList;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  function checkInputs() {
    let errorsList = []
    const firstNameExpectations = {
      type: "string",
      presence: "not empty",
      length: 50
    }
    const lastNameExpectations = {
      type: "string",
      presence: "not empty",
      length: 50
    }
    // const countryExpectations = {
    //   type: "string",
    //   presence: "not empty",
    //   value: countries
    // }
    const emailExpectations = {
      type: "string",
      presence: "not empty",
      validity: "email valid"
    }
    const referidoExpectations = {
      type: "string"
    }
    const birthdayDayExpectations = {
      type: "number",
      minimum: 1,
      maximum: 31
    }
    const birthdayMonthExpectations = {
      type: "number",
      minimum: 1,
      maximum: 12
    }
    const birthdayYearExpectations = {
      type: "number",
      maximum: new Date().getFullYear(),
      minimum: (new Date().getFullYear() - 120)
    }
    const phoneExpectations = {
      type: "number",
      presence: "not empty",
      validity: "phone valid"
    }
    // const categoryExpectations = {
    //   type: "string",
    //   presence: "not empty",
    //   value: categories.map(cat => cat.type)
    // };

    const errorsFirstName = checkForErrors("El nombre", firstName, firstNameExpectations, firstNameRef, "o")
    const errorsLastName = checkForErrors("El apellido", lastName, lastNameExpectations, lastNameRef, "a")
    // const errorsCountry = checkForErrors("El país", country, countryExpectations, countryRef, "o")
    const errorsEmail = checkForErrors("El correo", email, emailExpectations, emailRef, "o" )
    const errorsPhone = checkForErrors("El teléfono", phone, phoneExpectations, phoneRef, "o")
    const errorsReferido = checkForErrors("El referido", referido, referidoExpectations, referidoRef, "o")
    const errorsBirthdayDay = checkForErrors("El día de nacimiento", day, birthdayDayExpectations, dayRef, "o")
    const errorsBirthdayMonth = checkForErrors("El mes de nacimiento", month, birthdayMonthExpectations, monthRef, "o")
    const errorsBirthdayYear = checkForErrors("El año de nacimiento", year, birthdayYearExpectations, yearRef, "o")
    // const errorsCategory = checkForErrors("La categoría", category, categoryExpectations, categoryRef, "a")
    const errorInputs = [
      errorsFirstName,
      errorsLastName,
      errorsEmail, 
      errorsPhone,
      errorsReferido,
      errorsBirthdayDay,
      errorsBirthdayMonth,
      errorsBirthdayYear,
    ]

    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

  // async function fetchCategoryTypes() {
  //   try {
  //     const response = await fetch(`${baseURL}/api/admin/categories-type`, {
  //       method: 'GET',
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       credentials: "include"
  //     });

  //     if (response.ok === true) {
  //       const dataCategories = await response.json();
  //       setCategories(dataCategories);
  //     } else {
  //       console.log("There was an error fetching categories:", response.status);
  //     };

  //   } catch(error) {
  //     console.error("Error while fetching categories:", error);
  //   }
  // }

  // useEffect(() => {
  //   fetchCategoryTypes()
  // }, [])

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo autor</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre*"
          className="global-input" id='adding-author-first-name'
          ref={firstNameRef}
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido*"
          className="global-input" id="adding-author-last-name"
          ref={lastNameRef}
          onChange={(e) => setLastName(e.target.value)}></input>
        {/* <select className="select-global"
          id="country-select"
          ref={countryRef}
          onChange={(e) => dropDownChange(e, "Country")} >
          <option value="null">País*</option>
          {countries.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select> */}
        <input type='text' placeholder="Referido"
          className="global-input" id="adding-author-referido"
          ref={referidoRef}
          onChange={(e) => setReferido(e.target.value)}></input>
        <input type='text' placeholder="Correo*"
          className="global-input" id="adding-author-email"
          ref={emailRef}
          onChange={(e) => setEmail(e.target.value)}></input>
        <input type='text' placeholder="Teléfono*"
          className="global-input" id="adding-author-teléfono"
          ref={phoneRef}
          onChange={(e) => setPhone(e.target.value)}></input>
        <div className="modal-form-line">
          <label className="modal-form-label">Fecha de nacimiento</label>
          <div className="modal-birthday">
            <input type="text" placeholder="Día" 
              className="global-input birthday-day" maxLength="2"
              ref={dayRef}
              onChange={(e) => setDay(e.target.value)}></input>
            <input type="text" placeholder="Mes" 
              className="global-input birthday-month" maxLength="2"
              ref={monthRef}
              onChange={(e) => setMonth(e.target.value)}></input>
            <input type="text" placeholder="Año" 
              className="global-input birthday-year" maxLength="4"
              ref={yearRef}
              onChange={(e) => setYear(e.target.value)}></input>
          </div>
        </div>
        {/* <select className="select-global" id="category-select"
          ref={categoryRef}
          onChange={(e) => dropDownChange(e, "Category")}>
          <option value="null">Categoría</option>
          {categories && categories.map((category, index) => (
            <option key={index} value={category.type}>{category.type}</option>
          ))}
        </select> */}
        {/* <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/> */}
        <ErrorsList errors={errors} setErrors={setErrors} />
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingAuthorModal;
