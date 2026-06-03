import { useEffect, useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import "./AddingTransferModal.scss"
import { today } from "../../backend/utils.js";

function AddingTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [bookstoreNamesList, setBookstoresNamesList] = useState([]);
  const [errors, setErrors] = useState([]);
  const [transferType, setTransferType] = useState('');
  const [bookstoreId, setBookstoreId] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState(today());
  const bookstoreIdRef = useRef();
  const quantityRef = useRef();
  const dateRef = useRef();
  
  useEffect(() => {
    if (clickedRow.bookstoreId === 1) {
      setTransferType('send')
    } else {
      setTransferType('return')
      setBookstoreId(1)
    }
  }, [clickedRow])

  useEffect(() => {
    if (dateRef.current) {
      const d = new Date();
      dateRef.current.valueAsDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }, [transferType])

  useEffect(() => {
    let list = [];
    for (const bookstore of existingBookstores) {
      if (bookstore.id === 1) {
        continue;
      }

      list.push({
        'name': bookstore.name,
        'id': bookstore.id
      })
    }
    setBookstoresNamesList(list)
  }, [existingBookstores])

  async function fetchExistingBookstores() {
    try {
      const response = await fetch(`${baseURL}/api/admin/bookstores/existingBookstores`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setExistingBookstores(data);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchExistingBookstores();
  }, [clickedRow]);


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
    const expectationsBookstore = {
      type: "number",
      presence: "not empty",
      // value: bookstoreNamesList
    }
    const expectationsQuantity = {
      type: "number",
      presence: "not empty",
      range: "positive",
      maximum: clickedRow.disponibles
    }
    const expectationsDateStr = {
      presence: "not empty",
      type: "string",
      range: "no future"
    }

    if (transferType === "send") {
      const errorsBookstore = checkForErrors(
        "Librería",
        bookstoreId,
        expectationsBookstore,
        bookstoreIdRef,
        'a'
      );
      if (errorsBookstore.length > 0) {
        errorsList.push(errorsBookstore);
      };
      
      const errorsDateStr = checkForErrors(
        "Fecha",
        date,
        expectationsDateStr,
        dateRef,
        "a"
      )
      if (errorsDateStr.length > 0) {
        errorsList.push(errorsDateStr);
      };
    };

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

    if (quantity > clickedRow.disponibles) {
      errorsList.push([`El total de las cantidades es superior a lo disponible.`]);
      if (!quantityRef.current.classList.contains("error-inputs")) {
        quantityRef.current.classList.add("error-inputs");
      }
    }

    setErrors(prev => [...prev, errorsList]);
    return errorsList
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/transfers/transfer`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          bookstoreToId: bookstoreId,
          quantity: quantity,
          inventoryFromId: clickedRow.id,
          type: transferType,
          dateStr: date
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo movimiento.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Un nuevo movimiento ha sido creado.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>{transferType && transferType === "send" ? 'Ingreso a librería' : 'Nueva devolución'}</p>
        <p className="form-subtitle">{clickedRow && clickedRow.name }</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="global-form">
        {transferType === "send" ? (
          <>
            <div
              className="centered-entrega">
              <select
                className="global-input"
                ref={bookstoreIdRef}
                onChange={(e) => setBookstoreId(e.target.value)}
                >
                <option
                  value="null">
                  Libreria*
                </option>
                {bookstoreNamesList && bookstoreNamesList.map((bookstore, index) => (
                  <option
                    key={index}
                    value={`${bookstore.id}`}>
                    {bookstore.name}
                  </option>
                  ))};
              </select>
              <input
                type="date"
                className="global-input"
                ref={dateRef}
                onChange={(e) => setDate(e.target.value)}>
              </input>
              <input
                type='text'
                placeholder="Cantidad*"
                className="global-input transfer-quantity"
                ref={quantityRef}
                onChange={(e) => setQuantity(e.target.value)}>
              </input>
            </div>
          </>)
          :
          <>
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
              className="global-input"
              ref={dateRef}
              onChange={(e) => setDate(e.target.value)}>
            </input>
          </>
        }

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

export default AddingTransferModal;
