import { useEffect, useState, useRef } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
// import AddingAuthorModalErrors from "./AddingAuthorModalErrors";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditAuthorModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [firstName, setFirstName] = useState(clickedRow.first_name);
  const [lastName, setLastName] = useState(clickedRow.last_name);
  const [referido, setReferido] = useState(clickedRow.referido || "");
  const [email, setEmail] = useState(clickedRow.email || "");
  const [phone, setPhone] = useState(clickedRow.phone || '');
  const [birthday, setBirthday] = useState(clickedRow.birthday || '');
  const [day, setDay] = useState(clickedRow.birthday ? clickedRow.birthday.substring(0,2) : '');
  const [month, setMonth] = useState(clickedRow.birthday ? clickedRow.birthday.substring(2,4) : '');
  const [year, setYear] = useState(clickedRow.birthday ? clickedRow.birthday.substring(4,8) : '');
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

  // useEffect(() => {
  //   for (let i = 0; i < countries.length; i++) {
  //     if (countries[i] === clickedRow.country) {
  //       countries.splice(i, 1);
  //     } 
  //   }
  //   countries.splice(0, 0, clickedRow.country);
  //   setCountries(countries);
  // }, [clickedRow])

  // useEffect(() => {
  //   let displayedCategories = []
  //   displayedCategories.push(parseInt(clickedRow.category.type))
  //   for (let i = 0; i < categories.length; i++) {
  //     if (parseInt(categories[i].type) === parseInt(clickedRow.category.type)) {
  //       continue
  //     } else {
  //       displayedCategories.push(parseInt(categories[i].type))
  //     }
  //   }
  //   setDisplayedCategories(displayedCategories);
  // }, [clickedRow, categories])

  async function editAuthor() {
    // let fullCategory = {};
    // categories.map((cat) => {
    //   if (cat.type === category) {
    //     fullCategory = cat;
    //     return;
    //   }
    // });
    try {
      const response = await fetch(`${baseURL}/api/admin/user/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          referido: referido,
          email: email,
          phone: phone,
          birthday: birthday,
        })
      });

      if (response.ok) {
        const alertMessage = (`${firstName} ${lastName} ha estado actualizado con exito`);
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          checkForServerErrors(error.message);
          return;
        }
        const alertMessage = 'No se pudó editar el autor.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
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
  //     try {
  //       const response = await fetch(`${baseURL}/api/admin/categories-type`, {
  //         method: 'GET',
  //         headers: {
  //           "Content-Type": "application/json"
  //         },
  //         credentials: "include"
  //       });

  //       if (response.ok === true) {
  //         const dataCategories = await response.json();
  //         setCategories(dataCategories);
  //       } else {
  //         console.log("There was an error fetching categories:", response.status);
  //       };

  //     } catch(error) {
  //       console.error("Error while fetching categories:", error);
  //     }
  //   }

  // useEffect(() => {
  //   fetchCategoryTypes()
  // }, [])

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    editAuthor()
  }

  return (
      <div className="modal-proper">
        <div className="form-title">
          <p>Editar autor</p>
          <p className="form-subtitle">{clickedRow.first_name} {clickedRow.last_name}</p>
        </div>
        <div className="campos-obligatorios">
          <p>*Campos obligatorios</p>
        </div>
        <form className="global-form">
          <div className="modal-form-line">
            <label className="modal-form-label">Nombre *</label>
            <input type="text" value={`${firstName}`}
              className="global-input" id='adding-author-first-name'
              ref={firstNameRef}
              onChange={(e)=>setFirstName(e.target.value)}></input>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Apellido *</label>
            <input type="text" value={`${lastName}`} placeholder="Apellido"
              className="global-input" id="adding-author-last-name"
              ref={lastNameRef}
              onChange={(e)=>setLastName(e.target.value)}></input>
          </div>
          {/* <div className="modal-form-line">
            <label className="modal-form-label">País *</label>
            <select className="select-global"
              id="country-select"
              ref={countryRef}
              onChange={(e) => dropDownChange(e, "Country")} >
              {countries.map((country, index) => (
                <option key={index} value={country} placeholder="Pais">{country}</option>
              ))}
            </select>
          </div> */}
          <div className="modal-form-line">
            <label className="modal-form-label">Referido</label>
            <input type="text" value={`${referido || ""}`}
              ref={referidoRef}
              className="global-input" id="adding-author-referido"
              onChange={(e)=>setReferido(e.target.value)}></input>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Correo</label>
            <input type="text" value={`${email || ""}`}
              ref={emailRef}
              className="global-input" id="adding-author-email"
              onChange={(e)=>setEmail(e.target.value)}></input>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Teléfono</label>
            <input type='text'
              className="global-input" id="adding-author-teléfono"
              ref={phoneRef}
              onChange={(e) => setPhone(e.target.value)}></input>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Fecha de nacimiento</label>
            <div className="modal-birthday">
              <input type="text" placeholder="Día" 
                className="global-input birthday-day" maxLength="2"
                ref={dayRef}
                value={day}
                onChange={(e) => setDay(e.target.value)}></input>
              <input type="text" placeholder="Mes" 
                className="global-input birthday-month" maxLength="2"
                ref={monthRef}
                value={month}
                onChange={(e) => setMonth(e.target.value)}></input>
              <input type="text" placeholder="Año" 
                className="global-input birthday-year" maxLength="4"
                ref={yearRef}
                value={year}
                onChange={(e) => setYear(e.target.value)}></input>
            </div>
          </div>
          {/* <div className="modal-form-line">
            <label className="modal-form-label">Categoría</label>
            <select className="select-global" id="category-select"
              ref={categoryRef}
              onChange={(e) => dropDownChange(e, "Category")}>
              {displayedCategories && displayedCategories.map((cat, index) => (
                <option key={index} value={cat}>{cat}</option>
              ))}
            </select>
          </div> */}
        </form>
        {/* <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/> */}
        <ErrorsList errors={errors} setErrors={setErrors} />
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={handleSubmit}>Confirmar</button>
        </div>
      </div>
  )
}

export default EditAuthorModal;
