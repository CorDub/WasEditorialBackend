import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditImpressionModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const quantityRef = useRef();
  const [quantity, setQuantity] = useState(null);
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

    const errorsQuantity = checkForErrors("Cantidad inicial", quantity, expectationsCantidad, quantityRef);
    const errorInputs = [errorsQuantity];

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
      const response = await fetch('http://localhost:3000/admin/impression', {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          id: clickedRow.id,
          quantity: quantity,
          book_id: clickedRow.bookId
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear una nueva impression.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva impresion ha sido creada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  useEffect(() => {
    setQuantity(clickedRow.quantity);
  }, [clickedRow])

  return(
    <div className='modal-proper'>
      <div className="form-title">
        <p>Nueva impression</p>
      </div>
      <form className="global-form">
        <input
          type="text"
          placeholder="Cantidad"
          value={quantity}
          className="global-input"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}></input>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button
            type="button"
            className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button
            type='button'
            onClick={handleSubmit}
            className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
  )
}

export default EditImpressionModal;
