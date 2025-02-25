import { useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import AddingCategoryError from './AddingCategoryError';

function EditCategoryModal({ row, closeEditModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const [tipo, setTipo] = useState(row.type);
  const [regalias, setRegalias] = useState(row.percentage_royalties);
  const [gestionTiendas, setGestionTiendas] = useState(row.percentage_management_stores);
  const [gestionMinima, setGestionMinima] = useState(row.management_min);
  const [errorList, setErrorList] = useState([]);

  async function sendToServer() {
    try {
      const response = await fetch('http://localhost:3000/admin/category', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          tipo: tipo,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
        })
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message === "Uniqueness error - tipo") {
          checkForErrors(13);
          return;
        }

        const alertMessage = `No se pudó actualizar la categoría ${tipo}.`;
        closeEditModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {

        const alertMessage = `La categoría ${tipo} ha sido actualizada con exito.`;
        closeEditModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error("Error on frontend sending edit category info:", error);
    }
  }

  function addErrorClass(element) {
    if (!element.classList.contains("error-inputs")) {
      element.classList.add("error-inputs");
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
      if (input.classList.contains("error-inputs")) {
        input.classList.remove("error-inputs");
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
        <p>Editar categoría</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Tipo" value={tipo}
          className="global-input" id="adding-category-type"
          onChange={(e) => setTipo(e.target.value)}></input>
        <input type='text' placeholder="% Regalias de venta" value={regalias}
          className="global-input" id="adding-category-regalias"
          onChange={(e) => setRegalias(e.target.value)}></input>
        <input type='text' placeholder="% Gestion tiendas" value={gestionTiendas}
          className="global-input" id="adding-category-gestionTiendas"
          onChange={(e) => setGestionTiendas(e.target.value)}></input>
        <input type='text' placeholder="Gestion minima" value={gestionMinima}
          className="global-input" id="adding-category-gestionMinima"
          onChange={(e) => setGestionMinima(e.target.value)}></input>
        <AddingCategoryError errorList={errorList} setErrorList={setErrorList}/>
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

export default EditCategoryModal;
