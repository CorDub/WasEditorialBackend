import { useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin';
// import AddingCategoryError from './AddingCategoryError';
import { useEffect } from 'react';
import ErrorsList from "./ErrorsList";
import checkForErrors from './customHooks/checkForErrors';

function AddingCategoryModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  // const [tipo, setTipo] = useState('');
  const [regalias, setRegalias] = useState('');
  const [gestionTiendas, setGestionTiendas] = useState(null);
  const [gestionMinima, setGestionMinima] = useState(null);
  // const [errorList, setErrorList] = useState([]);
  const [type, setType] = useState(null);
  const [number, setNumber] = useState(null);
  const [rebate, setRebate] = useState(null);
  const regaliasRef = useRef()
  const rebateRef = useRef()
  const gestionTiendasRef = useRef()
  const gestionMinimaRef = useRef()
  const typeRef = useRef()
  const [errors, setErrors] = useState([])

  async function fetchCategories() {
    try {
      const response = await fetch(`${baseURL}/api/admin/categories`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json();
        setNumber(data.length + 1);
      }

    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/category`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          number: number,
          type: type,
          gestionMinima: gestionMinima,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          rebate: rebate
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message === "Uniqueness error - number") {
          closeModal(pageIndex, globalFilter, false, "Esta categoría ya existe", "error")
          return;
        }

        const alertMessage = `No se pudó crear una nueva categoría número ${number}.`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {

        const alertMessage = `Una nueva categoria número ${number} ha sido creada.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  // function addErrorClass(element) {
  //   if (!element.classList.contains("error-inputs")) {
  //     element.classList.add("error-inputs");
  //   };
  // }

  // function checkForErrors(serverError) {
  //   let newErrorList = [];
  //   // const inputNumber = document.getElementById("adding-category-number");
  //   const inputType = document.getElementById("adding-category-type");
  //   const inputRegalias = document.getElementById("adding-category-regalias");
  //   const inputGestionTiendas = document.getElementById("adding-category-gestionTiendas");
  //   const inputGestionMinima = document.getElementById("adding-category-gestionMinima");
  //   const inputRebate = document.getElementById("adding-category-descuento");
  //   let inputList = [];
  //   if (type === "regalias") {
  //     inputList = [inputType, inputRegalias, inputRebate]
  //   } else if (type === "comissions") {
  //     inputList = [inputType, inputGestionTiendas, inputGestionMinima]
  //   }
    
  //   inputList.forEach((input) => {
  //     if (input.classList.contains("error-inputs")) {
  //       input.classList.remove("error-inputs");
  //     }
  //   });

  //   if (type === false) {
  //     newErrorList.push(11);
  //     addErrorClass(inputType);
  //   } 

  //   if (serverError === 13) {
  //     newErrorList.push(13);
  //     addErrorClass(inputType);
  //   }

  //   if (type === "regalias") {
  //     if (isNaN(parseFloat(regalias))) {
  //       newErrorList.push(21);
  //       addErrorClass(inputRegalias);
  //     };

  //     if (regalias === "") {
  //       newErrorList.push(22);
  //       addErrorClass(inputRegalias);
  //     };

  //     if (parseFloat(regalias) > 100) {
  //       newErrorList.push(23);
  //       addErrorClass(inputRegalias);
  //     }

  //     if (!rebate) {
  //       newErrorList.push(51);
  //       addErrorClass(inputRebate);
  //     }

  //     if (isNaN(parseFloat(rebate))) {
  //       newErrorList.push(52);
  //       addErrorClass(inputRebate);
  //     }

  //     if (rebate < 0 || rebate > 100) {
  //       newErrorList.push(53);
  //       addErrorClass(inputRebate)
  //     }
  //   }

  //   if (type === "comissions") {
  //     if (isNaN(parseFloat(gestionTiendas))) {
  //       newErrorList.push(31);
  //       addErrorClass(inputGestionTiendas);
  //     };

  //     if (gestionTiendas === "") {
  //       newErrorList.push(32);
  //       addErrorClass(inputGestionTiendas);
  //     };

  //     if (parseFloat(gestionTiendas) > 100) {
  //       newErrorList.push(33);
  //       addErrorClass(inputGestionTiendas);
  //     }

  //     if (isNaN(parseFloat(gestionMinima))) {
  //       newErrorList.push(41);
  //       addErrorClass(inputGestionMinima);
  //     };

  //     if (gestionMinima === "") {
  //       newErrorList.push(42);
  //       addErrorClass(inputGestionMinima);
  //     };
  //   }

  //   setErrorList(newErrorList);
  //   return newErrorList;
  // }

  function checkInputs() {
    let errorsList = []
    const typeExpectations = {
      presence: "not empty",
      type: "string",
      value: ["comissions", "regalias"]
    }
    const regaliasExpectations = {
      type: "number",
      minimum: 0,
      maximum: 100
    }
    const rebateExpectations = {
      type: "number",
      minimum: 0,
      maximum: 100
    }
    const gestionTiendasExpectations = {
      type: "number",
      minimum: 0,
      maximum: 100
    }
    const gestionMinimaExpectations = {
      type: "number",
      range: "positive"
    }

    const errorsType = checkForErrors("Típo", type, typeExpectations, typeRef, "o");
    const errorsRegalias = type === "regalias" ? checkForErrors("Regalías", regalias, regaliasExpectations, regaliasRef, "as") : [];
    const errorsRebate = type === "regalias" ? checkForErrors("Descuento", rebate, rebateExpectations, rebateRef, "o") : [];
    const errorsGestionTiendas = type === "comissions" ? checkForErrors("Gestión tiendas", gestionTiendas, gestionTiendasExpectations, gestionTiendasRef, "a") : [];
    const errorsGestionMinima = type === "comissions" ? checkForErrors("Gestión minima", gestionMinima, gestionMinimaExpectations, gestionMinimaRef, "a") : [];
    const errorInputs = [
      errorsType,
      errorsRegalias,
      errorsRebate,
      errorsGestionTiendas,
      errorsGestionMinima
    ]

    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }
    sendToServer();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nueva categoría</p>
        <p className="form-subtitle">Número {number}</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <select className="select-global"
          id="adding-category-type"
          ref={typeRef}
          onChange={(e) => setType(e.target.value)}>
          <option value="null">Tipo*</option>
          <option value="regalias">Regalías</option>
          <option value="comissions">Comisiones</option>
        </select>
        {type === "comissions" && (
          <>
            <input type='text' placeholder="% Comisión extra de librerías*"
              className="global-input" id="adding-category-gestionTiendas"
              ref={gestionTiendasRef}
              onChange={(e) => setGestionTiendas(e.target.value)}></input>
            <input type='text' placeholder="Monto minimo de gestión en WAS*"
              className="global-input" id="adding-category-gestionMinima"
              ref={gestionMinimaRef}
              onChange={(e) => setGestionMinima(e.target.value)}></input>
          </>
        )}
        {type === "regalias" && (
          <>
            <input type='text' placeholder="Porcentaje para el autor*"
              className="global-input" id="adding-category-regalias"
              ref={regaliasRef}
              onChange={(e) => setRegalias(e.target.value)}></input>
            <input type='text' placeholder="% Descuento copia de autor*"
              className="global-input" id="adding-category-descuento"
              ref={rebateRef}
              onChange={(e) => setRebate(e.target.value)}></input>
          </>
        )}
        {/* <AddingCategoryError errorList={errorList} setErrorList={setErrorList}/> */}
        <ErrorsList errors={errors} setErrors={setErrors} />
        <div className="form-actions-cat">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingCategoryModal;
