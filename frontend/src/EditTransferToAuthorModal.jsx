import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";

function EditTransferToAuthorModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [errors, setErrors] = useState([]);
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const [note, setNote] = useState(clickedRow.note);
  const [dateStr, setDateStr] = useState(clickedRow.dateStr);
  const [place, setPlace] = useState(clickedRow.place);
  const [person, setPerson] = useState(clickedRow.person);
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
      maximum: clickedRow.current
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

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/transfers/transfer/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          quantity: quantity,
          inventoryFromId: clickedRow.id,
          type: "send",
          note: note,
          dateStr: dateStr,
          place: place,
          person: person,
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = error.error || 'No se pudó editar la entrega al autor.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `La entrega al autor ha sido editada con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Editar entrega al autor</p>
        <p className="form-subtitle">{clickedRow && clickedRow.title }</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="global-form">
        <input
          type='text'
          placeholder="Cantidad"
          className="global-input transfer-quantity"
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}
          value={quantity}>
        </input>
        <input
          type="date"
          placeholder="Fecha de entrega"
          className="global-input"
          onChange={(e) => setDateStr(e.target.value)}
          value={dateStr}/>
        <input
          type="text"
          placeholder="Lugar (opcional)"
          className="global-input"
          onChange={(e) => setPlace(e.target.value)}
          value={place}/>
        <input
          type="text"
          placeholder="Persona (opcional)"
          className="global-input"
          onChange={(e) => setPerson(e.target.value)}
          value={person}/>
        <input
          type="text"
          placeholder="Comentario para el autor (opcional)"
          className="global-input"
          onChange={(e) => setNote(e.target.value)}
          value={note}/>

        <ErrorsList errors={errors} setErrors={setErrors} />
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Editar</button>
        </div>
      </form>
    </div>
  )
}

export default EditTransferToAuthorModal;
