import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors.jsx";
import ErrorsList from "./ErrorsList.jsx";
import useCheckAdmin from "./customHooks/useCheckAdmin.jsx";

function EditTransferFromAuthorModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [errors, setErrors] = useState([]);
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const [note, setNote] = useState(cleanNote());
  const [dateStr, setDateStr] = useState(clickedRow.dateStr);
  const quantityRef = useRef();
  const dateStrRef = useRef();

  useEffect(() => {
    if (dateStrRef.current && dateStr) {
      const parts = dateStr.split('-');
      dateStrRef.current.valueAsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }, [])

  function cleanNote() {
    const len = clickedRow.note.length
    const cleanedNote = clickedRow.note.substring(27, len)
    return cleanedNote
  }

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
      // const response = await fetch(`${baseURL}/api/admin/impressions/impression/${clickedRow.id}`, {
      //   method: "PATCH",
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   credentials: "include",
      //   body: JSON.stringify({
      //     quantity: quantity,
      //     book_id: clickedRow.bookId,
      //     note: "- Devolución del autor - " + note,
      //     dateStr: dateStr,
      //     authorDelivery: true
      //   }),
      // });
      const response = await fetch(`${baseURL}/api/admin/transfers/transfer/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          toInventoryId: clickedRow.toInventoryId,
          quantity: quantity,
          type: "return",
          note: "- Devolución del autor - " + note,
          dateStr: dateStr,
          wasRed: true
        })
      })

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó editar la entrega del autor.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva entrega del autor ha sido editada.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Editar devolución del autor</p>
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
          onChange={(e) => setQuantity(e.target.value)}
          value={quantity}>
        </input>
        <input
          type="date"
          placeholder="Fecha"
          ref={dateStrRef}
          className="global-input transfer-quantity"
          onChange={(e) => setDateStr(e.target.value)}/>
        <input
          type="text"
          placeholder="Comentario (opcional)"
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

export default EditTransferFromAuthorModal;