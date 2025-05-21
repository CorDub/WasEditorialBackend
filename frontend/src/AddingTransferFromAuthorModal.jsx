import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";

function AddingTransferFromAuthorModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [errors, setErrors] = useState([]);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');
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
      "La cantidad",
      quantity,
      expectationsQuantity,
      quantityRef
    )

    if (errorsQuantity.length > 0) {
      errorsList.push(errorsQuantity);
    };
    console.log("errorsQuantity", errorsQuantity);

    setErrors(prev => [...prev, errorsList]);
    return errorsList
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/admin/impression`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          quantity: quantity,
          id: clickedRow.bookId,
          note: "- Entrega del autor - " + note
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
        <p>{clickedRow && clickedRow.book.title }</p>
      </div>
      <p style={{ fontSize: '0.9em', fontStyle: 'italic', textAlign: "center" }}>Una entrega del autor es considerada como una impression y sera visible en las impresiones</p>
      <form
        onSubmit={handleSubmit}
        className="global-form">
        <input
          type='text'
          placeholder="Cantidad"
          className="global-input transfer-quantity"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}>
        </input>
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
