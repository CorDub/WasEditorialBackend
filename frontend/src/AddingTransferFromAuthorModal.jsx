import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";
// import { DateTime } from "luxon";
import { today } from "../../backend/utils.js";

function AddingTransferFromAuthorModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [errors, setErrors] = useState([]);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(today());
  const quantityRef = useRef();
  const dateStrRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const errorList = checkInputs();
    if (errorList.length > 0) {
      return;
    }
    sendToServer();
  }

  function checkInputs() {
    // Prepare an error list that will be displayed if any
    let errorsList = []

    // Set expectations for each field being tested
    const expectationsQuantity = {
      type: "number",
      presence: "not empty",
      range: "positive",
    }

    const errorsQuantity = checkForErrors(
      "Cantidad",
      quantity,
      expectationsQuantity,
      quantityRef,
      "a"
    )
    //aditional check for not being over current entregados al autor
    const currentDevoluciones = clickedRow.entregadosDelAutor
    if ((currentDevoluciones + parseInt(quantity)) > clickedRow.entregadosAlAutor) {
      errorsQuantity.push("El autor no puede regresar mas libros que le han entregados")
    }

    const expectationsDateStr = {
      type: "string",
      presence: "not empty",
      range: "no future"
    }
    const errorsDateStr = checkForErrors("La fecha", dateStr, expectationsDateStr, dateStrRef, "a");

    const errorInputs = [errorsQuantity, errorsDateStr];
    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
      }
    }

    setErrors(prev => [...prev, errorsList]);
    return errorsList
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/impression`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          quantity: quantity,
          id: clickedRow.bookId,
          note: "- Entrega del autor - " + note,
          dateStr: dateStr,
          authorDelivery: true
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó registrar una nueva entrega del autor.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva entrega del autor ha sido registrada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva devolución del autor</p>
        <p className="form-subtitle">{clickedRow && clickedRow.title }</p>
      </div>
      {/* <p style={{ fontSize: '0.9em', fontStyle: 'italic', textAlign: "center" }}>Una devolución del autor está considerada como una impresión y sera visible en las impresiónes.</p> */}
      <form
        onSubmit={handleSubmit}
        className="global-form">
        <input
          type='text'
          placeholder="Cantidad"
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          className="global-input transfer-quantity"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}>
        </input>
        <input
          type="date"
          placeholder="Fecha"
          ref={dateStrRef}
          className="global-input transfer-quantity"
          onChange={(e) => setDateStr(e.target.value)}
          value={dateStr}/>
        <input
          type="text"
          placeholder="Comentario (opcional)"
          className="global-input"
          onChange={(e) => setNote(e.target.value)}/>

        <ErrorsList errors={errors} setErrors={setErrors} />
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir</button>
        </div>
      </form>
    </div>
  )
}

export default AddingTransferFromAuthorModal;
