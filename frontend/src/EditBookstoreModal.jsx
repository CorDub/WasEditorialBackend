import { useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import AddingBookstoreErrorList from "./AddingBookstoreErrorList";

function EditBookstoreModal({ row, closeEditModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [name, setName] = useState(row.name);
  const [dealPercentage, setDealPercentage] = useState(row.deal_percentage);
  const [contactName, setContactName] = useState(row.contact_name);
  const [contactPhone, setContactPhone] = useState(row.contact_phone);
  const [contactEmail, setContactEmail] = useState(row.contact_email);
  const [errorList, setErrorList] = useState([]);

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/admin/bookstore`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: contactPhone,
          contactEmail: contactEmail,
        })
      });

      if (response.ok === true) {
        const alertMessage = `Se actualizó con exito ${name}`;
        closeEditModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó actualizar ${name}`;
        closeEditModal(pageIndex, globalFilter, false, alertMessage, "error");
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
        <p>Nueva librería</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Nombre" value={name}
          className="global-input" id="adding-bookstore-name"
          onChange={(e) => setName(e.target.value)}></input>
        <input type='text' placeholder="% Acuerdo" value={dealPercentage}
          className="global-input" id="adding-bookstore-dealPercentage"
          onChange={(e) => setDealPercentage(e.target.value)}></input>
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
            onClick={() => closeEditModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Confirmar</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default EditBookstoreModal;
