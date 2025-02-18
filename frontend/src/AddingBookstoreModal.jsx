import { useState } from 'react';
import useCheckUser from './useCheckUser';
import AddingBookstoreErrorList from './AddingBookstoreErrorList';

function AddingBookstoreModal({ closeAddingModal, pageIndex, globalFilter }) {
  useCheckUser();

  const [name, setName] = useState('');
  const [dealPercentage, setDealPercentage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errorList, setErrorList] = useState([]);

  async function sendToServer() {

    try {
      const response = await fetch('http://localhost:3000/admin/bookstore', {
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
          contactEmail: contactEmail,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear una nueva librería.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Una nueva librería ${data.name} ha sido creado en la database.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  function addErrorClass(element) {
    if (!element.classList.contains("error")) {
      element.classList.add("error");
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
      if (input.classList.contains("error")) {
        input.classList.remove("error");
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
        <input type='text' placeholder="Nombre"
          className="global-input" id="adding-bookstore-name"
          onChange={(e) => setName(e.target.value)}></input>
        <input type='text' placeholder="% Acuerdo"
          className="global-input" id="adding-bookstore-dealPercentage"
          onChange={(e) => setDealPercentage(e.target.value)}></input>
        <input type='text' placeholder="Nombre del contacto"
          className="global-input" id="adding-bookstore-contactName"
          onChange={(e) => setContactName(e.target.value)}></input>
        <input type='text' placeholder="Téléfono"
          className="global-input" id="adding-bookstore-contactPhone"
          onChange={(e) => setContactPhone(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          className="global-input" id="adding-bookstore-contactEmail"
          onChange={(e) => setContactEmail(e.target.value)}></input>
        <AddingBookstoreErrorList errorList={errorList} setErrorList={setErrorList}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeAddingModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir nueva librería</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingBookstoreModal;
