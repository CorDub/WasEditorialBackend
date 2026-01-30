import { useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import AddingCategoryError from './AddingCategoryError';

function EditCategoryModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [type, setType] = useState(clickedRow.category_type);
  const [regalias, setRegalias] = useState(clickedRow.percentage_royalties);
  const [gestionTiendas, setGestionTiendas] = useState(clickedRow.percentage_management_stores);
  const [gestionMinima, setGestionMinima] = useState(clickedRow.management_min);
  const [errorList, setErrorList] = useState([]);
  const [number, setNumber] = useState(clickedRow.number);
  const [rebate, setRebate] = useState(clickedRow.rebate_author);

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/category/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          type: type,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
          number: number,
          rebate: rebate
        })
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message === "Uniqueness error - tipo") {
          checkForErrors(13);
          return;
        }

        const alertMessage = `No se pudó actualizar la categoría número ${number}.`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        console.log("response oko")
        const alertMessage = `La categoría número ${number} ha sido actualizada con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
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
    // const inputType = document.getElementById("adding-category-type");
    const inputRegalias = document.getElementById("adding-category-regalias");
    const inputGestionTiendas = document.getElementById("adding-category-gestionTiendas");
    const inputGestionMinima = document.getElementById("adding-category-gestionMinima");
    const inputRebate = document.getElementById("adding-category-descuento");
    let inputList = [];
    if (type === "regalias") {
      inputList = [inputRegalias, inputRebate]
    } else if (type === "comissions") {
      inputList = [inputGestionTiendas, inputGestionMinima]
    }

    inputList.forEach((input) => {
      if (input.classList.contains("error-inputs")) {
        input.classList.remove("error-inputs");
      }
    });

    inputList.forEach((input) => {
      if (input.classList.contains("error-inputs")) {
        input.classList.remove("error-inputs");
      }
    });

    // if (type === false) {
    //   newErrorList.push(11);
    //   addErrorClass(inputType);
    // }

    // if (serverError === 13) {
    //   newErrorList.push(13);
    //   addErrorClass(inputType);
    // }

    if (type === "regalias") {
      if (isNaN(parseFloat(regalias))) {
        newErrorList.push(21);
        addErrorClass(inputRegalias);
      };

      if (regalias === "") {
        newErrorList.push(22);
        addErrorClass(inputRegalias);
      };

      if (parseFloat(regalias) > 100) {
        newErrorList.push(23);
        addErrorClass(inputRegalias);
      }

      if (!rebate) {
        newErrorList.push(51);
        addErrorClass(inputRebate);
      }

      if (isNaN(parseFloat(rebate))) {
        newErrorList.push(52);
        addErrorClass(inputRebate);
      }

      if (rebate < 0 || rebate > 100) {
        newErrorList.push(53);
        addErrorClass(inputRebate)
      }
    }

    if (type === "comissions") {
      if (isNaN(parseFloat(gestionTiendas))) {
        newErrorList.push(31);
        addErrorClass(inputGestionTiendas);
      };

      if (gestionTiendas === "") {
        newErrorList.push(32);
        addErrorClass(inputGestionTiendas);
      };

      if (parseFloat(gestionTiendas) > 100) {
        newErrorList.push(33);
        addErrorClass(inputGestionTiendas);
      }

      if (isNaN(parseFloat(gestionMinima))) {
        newErrorList.push(41);
        addErrorClass(inputGestionMinima);
      };

      if (gestionMinima === "") {
        newErrorList.push(42);
        addErrorClass(inputGestionMinima);
      };
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
        <p>Editar categoría</p>
        <p className="form-subtitle">{clickedRow.number}</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Tipo *</label>
          <select className="select-global"
            id="adding-category-type"
            onChange={(e) => setType(e.target.value)}>
            {type === "comissions" && (
              <>
                <option value="comissions">Comisiones</option>
                <option value="regalias">Regalías</option>
              </>
            )}
            {type === "regalias" && (
              <>
                <option value="regalias">Regalías</option>
                <option value="comissions">Comisiones</option>
              </>
            )}
            {!type && (
              <>
                <option value="null">Tipo*</option>
                <option value="regalias">Regalías</option>
                <option value="comissions">Comisiones</option>
              </>
            )}
          </select>
        </div> */}
        {type === "comissions" && (
          <>
            <div className="modal-form-line">
              <label className="modal-form-label">Gestión tiendas (%) *</label>
              <input type='text' placeholder="% Gestion tiendas" value={gestionTiendas}
                className="global-input" id="adding-category-gestionTiendas"
                onChange={(e) => setGestionTiendas(e.target.value)}></input>
            </div>

            <div className="modal-form-line">
              <label className="modal-form-label">Gestión minima ($) *</label>
              <input type='text' placeholder="Gestion minima" value={gestionMinima}
                className="global-input" id="adding-category-gestionMinima"
                onChange={(e) => setGestionMinima(e.target.value)}></input>
            </div>
          </>
        )}
        {type === "regalias" && (
          <>
            <div className="modal-form-line">
              <label className="modal-form-label">Regalias de venta (%) *</label>
              <input type='text' placeholder="% Regalias de venta" value={regalias}
                className="global-input" id="adding-category-regalias"
                onChange={(e) => setRegalias(e.target.value)}></input>
            </div>

            <div className="modal-form-line">
              <label className="modal-form-label">Descuento copía de autor (%) *</label>
              <input type="text" placeholder="% Descuento copía de autor" value={rebate}
                className="global-input" id="adding-category-descuento"
                onChange={(e) => setRebate(e.target.value)}></input>
            </div>
          </>
        )}
        <AddingCategoryError errorList={errorList} setErrorList={setErrorList}/>
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

export default EditCategoryModal;
