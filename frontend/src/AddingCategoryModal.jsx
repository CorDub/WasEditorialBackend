import { useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin';
import { useEffect } from 'react';
import ErrorsList from "./ErrorsList";
import checkForErrors from './customHooks/checkForErrors';

function AddingCategoryModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [regalias, setRegalias] = useState('');
  const [gestionTiendas, setGestionTiendas] = useState(null);
  const [gestionMinima, setGestionMinima] = useState(null);
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
      const response = await fetch(`${baseURL}/api/admin/categories/categories`, {
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
      const response = await fetch(`${baseURL}/api/admin/categories/category`, {
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
