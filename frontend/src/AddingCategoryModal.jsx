import { useState } from 'react';
import useCheckUser from './useCheckUser';
import AddingCategoryError from './AddingCategoryError';

function AddingCategoryModal({ closeAddingModal, pageIndex, globalFilter }) {
  useCheckUser();

  const [tipo, setTipo] = useState('');
  const [regalias, setRegalias] = useState('');
  const [gestionTiendas, setGestionTiendas] = useState('');
  const [gestionMinima, setGestionMinima] = useState('');
  const [errorList, setErrorList] = useState([]);

  async function sendToServer() {
    try {
      const response = await fetch('http://localhost:3000/admin/category', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          tipo: tipo,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message === "Uniqueness error - tipo") {
          checkForErrors(13);
          return;
        }

        const alertMessage = `No se pudó crear una nueva categoria ${tipo}.`;
        closeAddingModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {

        const alertMessage = `Una nueva categoria ${tipo} ha sido creado.`;
        closeAddingModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
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

  function checkForErrors(serverError) {
    let newErrorList = [];
    const inputTipo = document.getElementById("adding-category-type");
    const inputRegalias = document.getElementById("adding-category-regalias");
    const inputGestionTiendas = document.getElementById("adding-category-gestionTiendas");
    const inputGestionMinima = document.getElementById("adding-category-gestionMinima");
    let inputList = [inputTipo, inputRegalias, inputGestionTiendas, inputGestionMinima];

    inputList.forEach((input) => {
      if (input.classList.contains("error")) {
        input.classList.remove("error");
      }
    });

    if (tipo === "") {
      newErrorList.push(11);
      addErrorClass(inputTipo);
    } else {
      if (tipo.length > 30) {
        newErrorList.push(12);
        addErrorClass(inputTipo)
      }
    };

    if (serverError === 13) {
      newErrorList.push(13);
      addErrorClass(inputTipo);
    }

    if (isNaN(parseFloat(regalias))) {
      newErrorList.push(21);
      addErrorClass(inputRegalias);
    };

    if (regalias === "") {
      newErrorList.push(22);
      addErrorClass(inputRegalias);
    };

    if (isNaN(parseFloat(gestionTiendas))) {
      newErrorList.push(31);
      addErrorClass(inputGestionTiendas);
    };

    if (gestionTiendas === "") {
      newErrorList.push(32);
      addErrorClass(inputGestionTiendas);
    };

    if (isNaN(parseFloat(gestionMinima))) {
      newErrorList.push(41);
      addErrorClass(inputGestionMinima);
    };

    if (gestionMinima === "") {
      newErrorList.push(42);
      addErrorClass(inputGestionMinima);
    };

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
        <p>Nueva categoría</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Tipo"
          className="global-input" id="adding-category-type"
          onChange={(e) => setTipo(e.target.value)}></input>
        <input type='text' placeholder="% Regalias de venta"
          className="global-input" id="adding-category-regalias"
          onChange={(e) => setRegalias(e.target.value)}></input>
        <input type='text' placeholder="% Gestion tiendas"
          className="global-input" id="adding-category-gestionTiendas"
          onChange={(e) => setGestionTiendas(e.target.value)}></input>
        <input type='text' placeholder="Gestion minima"
          className="global-input" id="adding-category-gestionMinima"
          onChange={(e) => setGestionMinima(e.target.value)}></input>
        <AddingCategoryError errorList={errorList} setErrorList={setErrorList}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeAddingModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingCategoryModal;
