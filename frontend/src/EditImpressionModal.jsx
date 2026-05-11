import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditImpressionModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  useCheckAdmin();
  const quantityRef = useRef();
  const dateStrRef = useRef();
  const noteRef = useRef();
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const [dateStr, setDateStr] = useState(clickedRow.dateStr);
  const [note, setNote] = useState(clickedRow.note)
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

    const expectationsDateStr = {
      type: "string",
      presence: "not empty",
      range: "no future"
    }
    const errorsDateStr = checkForErrors("La fecha", dateStr, expectationsDateStr, dateStrRef, "a");

    const expectationsNote = {
      type: "string",
      length: 255
    }
    const errorsNote = checkForErrors("La nota", note, expectationsNote, noteRef, "a")

    const errorInputs = [errorsQuantity, errorsDateStr, errorsNote];

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
      const response = await fetch(`${baseURL}/api/admin/impression/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          quantity: quantity,
          book_id: clickedRow.bookId,
          note: note,
          dateStr: dateStr
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
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
          ref={dateStrRef}
          onChange={(e) => setDateStr(e.target.value)}
          value={dateStr}></input>
        <input
          type="text"
          placeholder="Nota para el autor (opcional)"
          className="global-input"
          ref={noteRef}
          onChange={(e) => setNote(e.target.value)}></input>
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
