import { useState, useEffect, useRef } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin"
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditBookPricesModal({
  clickedRow,
  closeModal,
  pageIndex,
  globalFilter,
}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [prices, setPrices] = useState([])
  const [errors, setErrors] = useState([])
  const pricesRefs = useRef([]);

  useEffect(() => {
    let prices = [];
    for (const inv of clickedRow.inventories) {
      prices.push({
        "label": inv.bookstore.name,
        "bookstoreId": inv.bookstoreId,
        "inventoryId": inv.id,
        "price": inv.price,
      })
    }
    setPrices(prices)
  }, [clickedRow])

  function modifyPrice(value, index) {
    let pricesCopy = [...prices]
    pricesCopy[index]["price"] = value
    setPrices(pricesCopy)
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  function checkInputs() {
    let errorsList = [];

    const priceExpectations = {
      type: "number",
      presence: "not empty",
      range: "positive",
      minimum: 1
    }

    for (const index in prices) {
      const errors = checkForErrors(
        "Precio", 
        parseFloat(prices[index].price), 
        priceExpectations, 
        pricesRefs.current[index], 
        "o");
      if (errors.length > 0) {
        errorsList.push(errors)
      } 
    };

    setErrors(errorsList);
    return errorsList
  }

  async function sendToServer() {
    console.log(prices);
    try {
      const response = await fetch(`${baseURL}/api/admin/book/${clickedRow.id}/prices`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          prices: prices
        })
      })

      if (response.ok) {
        const alertMessage = "Los precios del libro han sido actualizados";
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = "No se pudieron actualizar los precios del libro";
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return(
    <div className="modal-proper">
      <form className="global-form" onSubmit={handleSubmit}>
        <div className="form-title">
          <p>Editar precios</p>
          <p className="form-subtitle">{clickedRow.title}</p>
        </div>
        <div className="campos-obligatorios">
          <p>*Campos obligatorios</p>
        </div>
        {prices && prices.map((inv, index) => (
          <div key={index} className="modal-form-line">
            <label className="modal-form-label">{inv.label} *</label>
            <input 
              type="text" 
              value={inv.price}
              className="global-input"
              onChange={(e) => modifyPrice(e.target.value, index)}
              ref={(ref) => pricesRefs.current[index] = ref}/>
          </div>
        ))}
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Confirmar</button>
        </div>
      </form>
    </div>
  )
}

export default EditBookPricesModal;