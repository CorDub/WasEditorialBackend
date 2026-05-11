import { useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin';
import checkForErrors from './customHooks/checkForErrors';
import ErrorsList from './ErrorsList';
import { countryCallingCodes } from '../countryCodes';

function AddingBookstoreModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [name, setName] = useState('');
  const [dealPercentage, setDealPercentage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPhonePrefix, setContactPhonePrefix] = useState('+52');
  // const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errors, setErrors] = useState([]);
  const nameRef = useRef();
  const dealPercentageRef = useRef();
  const contactNameRef = useRef();
  const contactPhoneRef = useRef();
  const contactPhonePrefixRef = useRef();
  const contactEmailRef = useRef();

  // useEffect(() => {
  //   setFullPhoneNumber(phonePrefix + contactPhone)
  // }, [contactPhone, phonePrefix])

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/bookstore`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: contactPhone,
          contactPhonePrefix: contactPhonePrefix,
          contactEmail: contactEmail,
        }),
      });

      if (response.ok === false) {
        const alertMessage = 'No se pude registrar una nueva librería.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Una nueva librería ${data.name} ha sido registrada en la database.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function checkInputs() {
    let newErrorList = [];
    const nameExpectations = {
      presence: "not empty",
      type: "string",
      length: 50
    };
    const dealPercentageExpectations = {
      presence: "not empty",
      type: "number",
      range: "positive",
      maximum: 100
    };
    const contactNameExpectations = {
      type: "string",
    };
    const contactPhoneExpectations = {
      validity: "phone valid"
    };
    const contactPhonePrefixExpectations = {
      validity: "phonePrefix valid"
    };
    const contactEmailExpectations =  {
      validity: "email valid"
    };

    const errorsName = checkForErrors("Nombre", name, nameExpectations, nameRef, 'o');
    const errorsDealPercentage = checkForErrors("Porcentaje de acuerdo", dealPercentage, dealPercentageExpectations, dealPercentageRef, 'o');
    const errorsContactName = contactName ? checkForErrors("Nombre del contacto", contactName, contactNameExpectations, contactNameRef, 'o') : [];
    const errorsContactPhone = contactPhone ? checkForErrors("Teléfono", contactPhone, contactPhoneExpectations, contactPhoneRef, 'o') : [];
    const errorsContactPhonePrefix = contactPhonePrefix ? checkForErrors("Prefijo de país", contactPhonePrefix, contactPhonePrefixExpectations, contactPhonePrefixRef, 'o') : [];
    const errorsContactEmail = contactEmail ? checkForErrors("Correo", contactEmail, contactEmailExpectations, contactEmailRef, 'o') : [];
    const errorInputs = [errorsName, errorsDealPercentage, errorsContactName, errorsContactPhone, errorsContactPhonePrefix, errorsContactEmail]
    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        newErrorList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return newErrorList;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const errorList = checkInputs();
    if (errorList.length > 0) {
      return;
    }
    sendToServer();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nueva librería</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Nombre de la librería*"
          className="global-input" id="adding-bookstore-name"
          ref={nameRef}
          onChange={(e) => setName(e.target.value)}></input>
        <input type='text' placeholder="% Acuerdo"
          className="global-input" id="adding-bookstore-dealPercentage"
          ref={dealPercentageRef}
          onChange={(e) => setDealPercentage(e.target.value)}></input>
        <input type='text' placeholder="Nombre del contacto"
          className="global-input" id="adding-bookstore-contactName"
          ref={contactNameRef}
          onChange={(e) => setContactName(e.target.value)}></input>
        <div className="modal-form-line">
          <label className="modal-form-label">Teléfono*</label>
          <div className="modal-phone">
            <select className="select-phone"
              ref={contactPhonePrefixRef}
              onChange={(e) => setContactPhonePrefix(e.target.value)}>
              {countryCallingCodes.map((country, index) => (
                <option key={index} value={country.code}>{country.iso3} {country.code}</option>
              ))}
            </select>
            <input type='text'
              className="input-phone" id="adding-author-teléfono"
              inputMode="numeric"
              pattern="[0-9]*"
              ref={contactPhoneRef}
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              onChange={(e) => setContactPhone(e.target.value)}></input>
          </div>
        </div>
        <input type='text' placeholder="Correo"
          className="global-input" id="adding-bookstore-contactEmail"
          ref={contactEmailRef}
          onChange={(e) => setContactEmail(e.target.value)}></input>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir nueva librería</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingBookstoreModal;
