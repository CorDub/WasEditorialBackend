import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { DateTime } from "luxon";

function AddingTransferFromAuthorModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [errors, setErrors] = useState([]);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const quantityRef = useRef();

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

    if (errorsQuantity.length > 0) {
      errorsList.push(errorsQuantity);
    };

    setErrors(prev => [...prev, errorsList]);
    return errorsList
  }

  function properDate(deliveryDate) {
    const dateToUse = deliveryDate === "" ? new Date().toISOString() : deliveryDate
    const properDate = DateTime
      .fromISO(dateToUse, {zone: "America/Mexico_City"})
      // .set({ hour: 12, minute: 0, second: 0})
      .toUTC()
    return properDate
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
          deliveryDate: properDate(deliveryDate),
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
        <p>Nueva entrega del autor</p>
        <p className="form-subtitle">{clickedRow && clickedRow.title }</p>
      </div>
      <p style={{ fontSize: '0.9em', fontStyle: 'italic', textAlign: "center" }}>Una entrega del autor está considerada como una impresión y sera visible en las impresiónes.</p>
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
          className="global-input transfer-quantity"
          onChange={(e) => setDeliveryDate(e.target.value)}/>
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
