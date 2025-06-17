import { useState } from "react";
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

  async function sendToServer() {
    try {
      console.log("commissions in sendtoserver", comissions)
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
        <p>{clickedRow.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Nombre" value={name}
          className="global-input" id="adding-bookstore-name"
          onChange={(e) => setName(e.target.value)}></input>
        <input type='text' placeholder="% Acuerdo" value={dealPercentage}
          className="global-input" id="adding-bookstore-dealPercentage"
          onChange={(e) => setDealPercentage(e.target.value)}></input>
        <select className="select-global"
          onChange={(e) => setComissions(e.target.value === "true")}>
          {comissions 
            ? <>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </>
            : <>
              <option value="false">No</option>
              <option value="true">Sí</option>
            </>}
        </select>
        <input type='text' placeholder="Nombre del contacto" value={contactName}
          className="global-input" id="adding-bookstore-contactName"
          onChange={(e) => setContactName(e.target.value)}></input>
        <input type='text' placeholder="Téléfono" value={contactPhone}
          className="global-input" id="adding-bookstore-contactPhone"
          onChange={(e) => setContactPhone(e.target.value)}></input>
        <input type='text' placeholder="Correo" value={contactEmail}
          className="global-input" id="adding-bookstore-contactEmail"
          onChange={(e) => setContactEmail(e.target.value)}></input>
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
