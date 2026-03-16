import { useRef, useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import ErrorsList from "./ErrorsList";
import checkForErrors from "./customHooks/checkForErrors";
import { convertISOString, today } from "../../backend/utils";

function AddingImpressionModal({
    clickedRow,
    closeModal,
    pageIndex,
    globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const quantityRef = useRef();
  const dateStrRef = useRef();
  const noteRef = useRef();
  // const entregaDelAutorRef = useRef();
  const [quantity, setQuantity] = useState(null);
  const [dateStr, setDateStr] = useState(today());
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState([]);
  // const [entregaDelAutor, setEntregaDelAutor] = useState(false);

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
      const response = await fetch(`${baseURL}/api/admin/impression`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          id: clickedRow.id,
          quantity: quantity,
          note: note,
          dateStr: dateStr,
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

  return(
    <div className='modal-overlay'>
      <div className='modal-proper'>
      <div className="form-title">
        <p>Nueva impression</p>
      </div>
      <div className="campos-obligatorios-new-impressions">
        <p>Nuevas impresiónes se suman a los libros disponibles
          en el inventario de WAS Editorial.</p>
      </div>
      <form className="global-form">
        {/* <div className="modal-form-checkbox-line">
          <label className="modal-form-checkbox-label">¿Entrega del autor?</label>
          <input 
          type="checkbox"
          ref={entregaDelAutorRef}
          className="checkbox-input"
          onChange={(e) => setEntregaDelAutor(e.target.checked)}/>
          </div> */}
        <input
          type="text"
          placeholder="Cantidad"
          className="global-input"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}></input>
        <input
          type="date"
          placeholder="Fecha"
          className="global-input"
          ref={dateStrRef}
          onChange={(e) => setDateStr(e.target.value)}
          value={convertISOString(dateStr)}></input>
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
            className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingImpressionModal;
