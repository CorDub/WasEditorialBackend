import { useEffect, useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin.jsx';
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { countryCallingCodes } from '../countryCodes.js';

function AddingAuthorModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referido, setReferido] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const referidoRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const phonePrefixRef = useRef();
  const dayRef = useRef();
  const monthRef = useRef();
  const yearRef = useRef();
  const fullBirthdayRef = useRef();
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setBirthday(day.padStart(2, "0") + month.padStart(2, "0") + year)
  }, [day, month, year])

  useEffect(() => {
    setFullPhoneNumber(phonePrefix + phone)
  }, [phone, phonePrefix])

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
          phonePrefix: phonePrefix,
          birthday: birthday === "0000" ? null : birthday,
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          checkForServerErrors(error.message);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo autor.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un(a) nuev(o.a) autor(a) ${data.firstName} ${data.lastName} ha sido creado en la database.
        Un correo le ha estado enviado para ingresar a la plataforma.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

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
      presence: "not empty",
      type: "string",
      length: 50
    }
    const lastNameExpectations = {
      presence: "not empty",
      type: "string",
      length: 50
    }
    const emailExpectations = {
      presence: "not empty",
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
      presence: "not empty",
      validity: "phone valid"
    }
    const phonePrefixExpectations = {
      presence: "not empty",
      validity: "phonePrefix valid"
    }
    const fullBirthdayExpectations = {
      validity: "birthday valid"
    }

    const errorsFirstName = checkForErrors("Nombre", firstName, firstNameExpectations, firstNameRef, "o")
    const errorsLastName = checkForErrors("Apellido", lastName, lastNameExpectations, lastNameRef, "a")
    const errorsEmail = checkForErrors("Correo", email, emailExpectations, emailRef, "o" )
    const errorsPhone = checkForErrors("Teléfono", phone, phoneExpectations, phoneRef, "o")
    const errorsPhonePrefix = checkForErrors("Prefijo de país", phonePrefix, phonePrefixExpectations, phonePrefixRef, "o")
    const errorsReferido = checkForErrors("Referido", referido, referidoExpectations, referidoRef, "o")
    const errorsBirthdayDay = day !== "" ? checkForErrors("Día de nacimiento", day, birthdayDayExpectations, dayRef, "o") : [];
    const errorsBirthdayMonth = month !== "" ? checkForErrors("Mes de nacimiento", month, birthdayMonthExpectations, monthRef, "o") : [];
    const errorsBirthdayYear = year !== "" ? checkForErrors("Año de nacimiento", year, birthdayYearExpectations, yearRef, "o") : [];
    const errorsFullBirthday = birthday !== "0000" && birthday !== "" ? checkForErrors("Fecha de nacimiento", birthday, fullBirthdayExpectations, fullBirthdayRef, "a") : [];
    const errorInputs = [
      errorsFirstName,
      errorsLastName,
      errorsEmail,
      errorsPhone,
      errorsPhonePrefix,
      errorsReferido,
      errorsBirthdayDay,
      errorsBirthdayMonth,
      errorsBirthdayYear,
      errorsFullBirthday
    ]

    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

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
        <input type='text' placeholder="Referido"
          className="global-input" id="adding-author-referido"
          ref={referidoRef}
          onChange={(e) => setReferido(e.target.value)}></input>
        <input type='text' placeholder="Correo*"
          className="global-input" id="adding-author-email"
          ref={emailRef}
          onChange={(e) => setEmail(e.target.value)}></input>
        <div className="modal-form-line">
          <label className="modal-form-label">Teléfono*</label>
          <div className="modal-phone">
            <select className="select-phone"
              ref={phonePrefixRef}
              onChange={(e) => setPhonePrefix(e.target.value)}>
              {countryCallingCodes.map((country, index) => (
                <option key={index} value={country.code}>{country.iso3} {country.code}</option>
              ))}
            </select>
            <input type='text'
              className="input-phone" id="adding-author-teléfono"
              inputMode="numeric"
              pattern="[0-9]*"
              ref={phoneRef}
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              onChange={(e) => setPhone(e.target.value)}></input>
          </div>
        </div>
        <div className="modal-form-line" ref={fullBirthdayRef}>
          <label className="modal-form-label">Fecha de nacimiento</label>
          <div className="modal-birthday">
            <input type="text" placeholder="dd"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              className="global-input birthday-day" maxLength="2"
              ref={dayRef}
              onChange={(e) => setDay(e.target.value)}></input>
            <input type="text" placeholder="mm"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              className="global-input birthday-month" maxLength="2"
              ref={monthRef}
              onChange={(e) => setMonth(e.target.value)}></input>
            <input type="text" placeholder="aaaa"
              className="global-input birthday-year" maxLength="4"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              ref={yearRef}
              onChange={(e) => setYear(e.target.value)}></input>
          </div>
        </div>
        <ErrorsList errors={errors} setErrors={setErrors} />
        <p style={{fontSize:"14px", textAlign: "center", width: "70%"}}>Añadir un nuevo autor en la base de datos le manda 
            automaticamente un correo para ingresar en la plataforma.</p>
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
