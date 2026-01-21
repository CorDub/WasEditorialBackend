import { useEffect, useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import AddingBookstoreErrorList from "./AddingBookstoreErrorList";
import { countryCallingCodes } from "../countryCodes";

function EditBookstoreModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [name, setName] = useState(clickedRow.name);
  const [dealPercentage, setDealPercentage] = useState(clickedRow.deal_percentage);
  const [contactName, setContactName] = useState(clickedRow.contact_name);
  const [contactPhone, setContactPhone] = useState("");
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState(clickedRow.contact_email);
  const [errorList, setErrorList] = useState([]);
  const [sortedCountryCodes, setSortedCountryCodes] = useState([]);

  useEffect(() => {
    setFullPhoneNumber(phonePrefix + contactPhone)
  }, [contactPhone, phonePrefix])

  // Get the prefix and sort the list based on this
  useEffect(() => {
    if (clickedRow.contact_phone) {
      // get the code
      const codeLength = clickedRow.contact_phone.length - 10;
      const prefix = clickedRow.contact_phone.substring(0, codeLength);
      const phoneNumber = clickedRow.contact_phone.substring(codeLength, clickedRow.contact_phone.length);

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
      setPhonePrefix(prefix)
      setContactPhone(phoneNumber)
      setSortedCountryCodes(sortedCountryCodeList)
    } else {
      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === phonePrefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === phonePrefix) { continue }
        sortedCountryCodeList.push(country)
      }

      // set everything
      setSortedCountryCodes(sortedCountryCodeList)
    }
  }, [clickedRow.contact_phone])

  async function sendToServer() {
    try {
      console.log("fullPhoneNumber", fullPhoneNumber);
      const response = await fetch(`${baseURL}/api/admin/bookstore/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: fullPhoneNumber,
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

  function addErrorClass(element) {
    if (!element.classList.contains("error-inputs")) {
      element.classList.add("error-inputs");
    };
  }

  function checkForErrors() {
    let newErrorList = [];
    const inputName = document.getElementById("adding-bookstore-name");
    const inputDealPercentage = document.getElementById("adding-bookstore-dealPercentage");
    const inputContactName = document.getElementById("adding-bookstore-contactName");
    const inputContactPhone = document.getElementById("adding-bookstore-contactPhone");
    const inputContactEmail = document.getElementById("adding-bookstore-contactEmail");
    let inputList = [inputName, inputDealPercentage, inputContactName, inputContactPhone, inputContactEmail];

    inputList.forEach((input) => {
      if (input.classList.contains("error-inputs")) {
        input.classList.remove("error-inputs");
      }
    });

    if (name === "") {
      newErrorList.push(11);
      addErrorClass(inputName);
    }

    setErrorList(newErrorList);
    return newErrorList;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const errorList = checkForErrors();
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
              onChange={(e) => setName(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
            <label className="modal-form-label">Percentage de acuerdo</label>
            <input type='text' placeholder="% Acuerdo" value={dealPercentage}
              className="global-input" id="adding-bookstore-dealPercentage"
              onChange={(e) => setDealPercentage(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Nombre del contacto</label>
          <input type='text' placeholder="Nombre del contacto" value={contactName}
            className="global-input" id="adding-bookstore-contactName"
            onChange={(e) => setContactName(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Teléfono*</label>
          <div className="modal-phone">
            <select className="select-phone"
              onChange={(e) => setPhonePrefix(e.target.value)}>
              {sortedCountryCodes.map((country, index) => (
                <option key={index} value={country.code}>{country.iso3} {country.code}</option>
              ))}
            </select>
            <input type='text'
              className="input-phone" id="adding-bookstore-contactPhone"
              inputmode="numeric"
              pattern="[0-9]*"
              value={contactPhone}
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              onChange={(e) => setContactPhone(e.target.value)}></input>
          </div>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Correo</label>
          <input type='text' placeholder="Correo" value={contactEmail}
            className="global-input" id="adding-bookstore-contactEmail"
            onChange={(e) => setContactEmail(e.target.value)}></input>
        </div>
        <AddingBookstoreErrorList errorList={errorList} setErrorList={setErrorList}/>
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
