import { useEffect, useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import AddingBookstoreErrorList from "./AddingBookstoreErrorList";

function EditBookstoreModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [name, setName] = useState(clickedRow.name);
  const [dealPercentage, setDealPercentage] = useState(clickedRow.deal_percentage);
  const [comissions, setComissions] = useState(clickedRow.comissions);
  const [contactName, setContactName] = useState(clickedRow.contact_name);
  const [contactPhone, setContactPhone] = useState(clickedRow.contact_phone);
  const [contactEmail, setContactEmail] = useState(clickedRow.contact_email);
  const [errorList, setErrorList] = useState([]);
  const [comissionsDisplay, setComissionsDisplay] = useState([]);

  useEffect(() => {
    let possibleComissions = [true, false]
    for (let i = 0; i < possibleComissions.length; i++) {
      if (possibleComissions[i] === clickedRow.comissions) {
        possibleComissions.splice(i, 1);
      } 
    }
    possibleComissions.splice(0, 0, clickedRow.comissions);

    let siono = [];
    for (const poss of possibleComissions) {
      if (poss === true) {
        siono.push("Sí")
      } else if (poss === false) {
        siono.push("No")
      }
    }

    setComissionsDisplay(siono);
  }, [clickedRow.comissions])

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/admin/bookstore`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: clickedRow.id,
          name: name,
          dealPercentage: dealPercentage,
          comissions: comissions,
          contactName: contactName,
          contactPhone: contactPhone,
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
    const inputComissions = document.getElementById("adding-bookstore-comissions");
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

  function convertComissionsValue(e) {
    if (e.target.value === "Sí") {
      setComissions(true)
    } else {
      setComissions(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Editar librería</p>
        <p className="form-subtitle">{clickedRow.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <div className="modal-form-line">
            <label className="modal-form-label">Nombre</label>
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
          <label className="modal-form-label">Comisiones</label>
          <select className="select-global"
            id="adding-bookstore-comissions"
            onChange={(e) => convertComissionsValue(e)}>
            {comissionsDisplay.map((comission, index) => (
              <option key={index} value={comission}>{comission}</option>
            ))}
          </select>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Nombre del contacto</label>
          <input type='text' placeholder="Nombre del contacto" value={contactName}
            className="global-input" id="adding-bookstore-contactName"
            onChange={(e) => setContactName(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Teléfono</label>
          <input type='text' placeholder="Teléfono" value={contactPhone}
            className="global-input" id="adding-bookstore-contactPhone"
            onChange={(e) => setContactPhone(e.target.value)}></input>
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
