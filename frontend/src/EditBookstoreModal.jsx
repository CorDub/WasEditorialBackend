import { useEffect, useState, useRef } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import ErrorsList from "./ErrorsList";
import checkForErrors from "./customHooks/checkForErrors";
import { countryCallingCodes } from "../countryCodes";

function EditBookstoreModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [name, setName] = useState(clickedRow.name);
  const [dealPercentage, setDealPercentage] = useState(clickedRow.deal_percentage);
  const [contactName, setContactName] = useState(clickedRow.contact_name);
  const [contactPhone, setContactPhone] = useState(clickedRow.contact_phone);
  const [contactPhonePrefix, setContactPhonePrefix] = useState(clickedRow.contact_phone_prefix);
  // const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState(clickedRow.contact_email);
  const [errors, setErrors] = useState([]);
  const [sortedCountryCodes, setSortedCountryCodes] = useState([]);
  const nameRef = useRef();
  const dealPercentageRef = useRef();
  const contactNameRef = useRef();
  const contactPhoneRef = useRef();
  const contactPhonePrefixRef = useRef();
  const contactEmailRef = useRef();

  // useEffect(() => {
  //   setFullPhoneNumber(phonePrefix + contactPhone)
  // }, [contactPhone, phonePrefix])

  // Get the prefix and sort the list based on this
  useEffect(() => {
    if (clickedRow.contact_phone) {
      // get the code
      const prefix = clickedRow.contact_phone_prefix;
      const phoneNumber = clickedRow.contact_phone;

      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === prefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === prefix) { continue }
        sortedCountryCodeList.push(country)
      }

      // set everything
      setContactPhonePrefix(prefix)
      setContactPhone(phoneNumber)
      setSortedCountryCodes(sortedCountryCodeList)
    } else {
      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === contactPhonePrefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === contactPhonePrefix) { continue }
        sortedCountryCodeList.push(country)
      }

      // set everything
      setSortedCountryCodes(sortedCountryCodeList)
    }
  }, [clickedRow.contact_phone])

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/bookstores/bookstore/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: contactPhone,
          contactPhonePrefix: contactPhonePrefix,
          contactEmail: contactEmail,
        })
      });

      if (response.ok === true) {
        const alertMessage = `Se actualizó con exito ${name}`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó actualizar ${name}`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
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
        <p>Editar librería</p>
        <p className="form-subtitle">{clickedRow.name}</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <div className="modal-form-line">
            <label className="modal-form-label">Nombre *</label>
            <input type='text' placeholder="Nombre" value={name}
              className="global-input" id="adding-bookstore-name"
              ref={nameRef}
              onChange={(e) => setName(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
            <label className="modal-form-label">Percentage de acuerdo</label>
            <input type='text' placeholder="% Acuerdo" value={dealPercentage}
              className="global-input" id="adding-bookstore-dealPercentage"
              ref={dealPercentageRef}
              onChange={(e) => setDealPercentage(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Nombre del contacto</label>
          <input type='text' placeholder="Nombre del contacto" value={contactName}
            className="global-input" id="adding-bookstore-contactName"
            ref={contactNameRef}
            onChange={(e) => setContactName(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Teléfono</label>
          <div className="modal-phone">
            <select className="select-phone"
              ref={contactPhonePrefixRef}
              onChange={(e) => setContactPhonePrefix(e.target.value)}>
              {sortedCountryCodes.map((country, index) => (
                <option key={index} value={country.code}>{country.iso3} {country.code}</option>
              ))}
            </select>
            <input type='text'
              className="input-phone" id="adding-bookstore-contactPhone"
              inputMode="numeric"
              pattern="[0-9]*"
              value={contactPhone}
              ref={contactPhoneRef}
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              onChange={(e) => setContactPhone(e.target.value)}></input>
          </div>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Correo</label>
          <input type='text' placeholder="Correo" value={contactEmail}
            className="global-input" id="adding-bookstore-contactEmail"
            ref={contactEmailRef}
            onChange={(e) => setContactEmail(e.target.value)}></input>
        </div>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Confirmar</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default EditBookstoreModal;
