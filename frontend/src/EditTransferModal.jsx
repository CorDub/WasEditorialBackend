import { useEffect, useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import "./AddingTransferModal.scss"

function EditTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [bookstoreNamesList, setBookstoresNamesList] = useState([]);
  const [errors, setErrors] = useState([]);
  const [transferType, setTransferType] = useState('');
  const [bookstoreId, setBookstoreId] = useState(clickedRow.toInventory.bookstoreId);
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const [date, setDate] = useState(clickedRow.dateStr);
  const bookstoreIdRef = useRef();
  const quantityRef = useRef();
  const dateRef = useRef();
  
  useEffect(() => {
    if (clickedRow.fromInventory.bookstoreId === 1) {
      setTransferType('send')
    } else {
      setTransferType('return')
      setBookstoreId(1)
    }
  }, [clickedRow])

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
    // const expectationsBookstore = {
    //   type: "number",
    //   presence: "not empty",
    //   // value: bookstoreNamesList
    // }
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
      // const errorsBookstore = checkForErrors(
      //   "Librería",
      //   bookstoreId,
      //   expectationsBookstore,
      //   bookstoreIdRef,
      //   'a'
      // );
      // if (errorsBookstore.length > 0) {
      //   errorsList.push(errorsBookstore);
      // };
      
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
      const response = await fetch(`${baseURL}/api/admin/transfers/transfer/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          toInventoryId: clickedRow.toInventoryId,
          quantity: quantity,
          inventoryFromId: clickedRow.fromInventoryId,
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
        const alertMessage = error.error || 'No se pudó editar este movimiento.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `El movimiento ha sido editado.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>{transferType && transferType === "send" ? 'Editar ingreso a librería' : 'Editar devolución'}</p>
        <p className="form-subtitle">{clickedRow && clickedRow.name}</p>
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
              {/* <select
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
              </select> */}
              <input
                type="date"
                className="global-input"
                ref={dateRef}
                onChange={(e) => setDate(e.target.value)}
                value={date}>
              </input>
              <input
                type='text'
                placeholder="Cantidad*"
                className="global-input transfer-quantity"
                ref={quantityRef}
                onChange={(e) => setQuantity(e.target.value)}
                value={quantity}>
              </input>
            </div>
          </>)
          :
          <>
            <input
              type="date"
              className="global-input"
              ref={dateRef}
              onChange={(e) => setDate(e.target.value)}
              value={date}>
            </input>
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
          </>
        }

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

export default EditTransferModal;