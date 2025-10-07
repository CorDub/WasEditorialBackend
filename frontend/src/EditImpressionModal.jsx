import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { convertISOString } from "../../backend/utils";

function EditImpressionModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  useCheckAdmin();
  const quantityRef = useRef();
  const dateRef = useRef();
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const [date, setDate] = useState(convertISOString(clickedRow.date));
  const [errors, setErrors] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  function checkInputs() {
    let errorsList = []
    const expectationsCantidad = {
      type: "number",
      presence: "not empty",
      range: "positive"
    }
    const errorsQuantity = checkForErrors("La cantidad", quantity, expectationsCantidad, quantityRef, "a");
    
    const expectationsDate = {
      type: "datetime",
      presence: "not empty",
      range: "no future"
    }
    const errorsDate = checkForErrors("La fecha", date, expectationsDate, dateRef, "a");

    const errorInputs = [errorsQuantity, errorsDate];

    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/admin/impression`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          id: clickedRow.id,
          quantity: quantity,
          book_id: clickedRow.bookId,
          date: date
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó editar la impresión.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `La impresión ha sido actualizada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  // useEffect(() => {
  //   setQuantity(clickedRow.quantity);
  // }, [clickedRow])

  return(
    <div className='modal-proper'>
      <div className="form-title">
        <p>Editar impresión</p>
      </div>
      <form className="global-form">
        <input
          type="text"
          placeholder="Cantidad"
          value={quantity}
          className="global-input"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}></input>
        <input 
          type="date"
          placeholder="Fecha"
          className="global-input"
          ref={dateRef}
          onChange={(e) => setDate(e.target.value)}
          value={convertISOString(date)}></input>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button
            type="button"
            className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, true)}>Cancelar</button>
          <button
            type='button'
            onClick={handleSubmit}
            className="blue-button">Editar</button>
        </div>
      </form>
      </div>
  )
}

export default EditImpressionModal;
