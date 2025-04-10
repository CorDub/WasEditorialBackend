import { useEffect, useState } from "react";
import Tooltip from "./Tooltip";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import "./AddingTransferModal.scss"

function AddingTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const [bookstoresToTransfer, setBookstoresToTransfer] = useState([null]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [bookstoreNamesList, setBookstoresNamesList] = useState([]);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let list = [];
    for (const bookstore of existingBookstores) {
      list.push(bookstore.name)
    }
    setBookstoresNamesList(list)
  }, [existingBookstores])

  async function fetchExistingBookstores() {
    try {
      const response = await fetch('http://localhost:3000/admin/existingBookstores', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const cleanedUpData = data.filter(bookstore => bookstore.name !== clickedRow.bookstore.name)
        setExistingBookstores(cleanedUpData);
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchExistingBookstores();
  }, [clickedRow]);

  function toggleTooltip(message, elementId) {
    if (x === null || y === null) {
      const element = document.getElementById(elementId);
      const elementRect = element.getBoundingClientRect();
      setY(elementRect.top);
      setX(elementRect.left);
      setTooltipMessage(message);
    } else {
      setY(null);
      setX(null);
      setTooltipMessage("");
    }
  }

  function addOtherBookstore() {
    setBookstoresToTransfer([...bookstoresToTransfer, 0]);
  }

  function removeOtherBookstore(indexToRemove) {
    setBookstoresToTransfer(bookstoresToTransfer.filter((_, index)=> index !== indexToRemove));
    setX(null);
    setY(null);
    setTooltipMessage("");
  }

  function dropDownChange(e, input_index) {
    let soFar = [...bookstoresToTransfer];
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }
    soFar[input_index]["bookstoreId"] = e.target.value;
    let bookstoreName = [];
    for (const bookstore of existingBookstores) {
      if (bookstore.id === parseInt(e.target.value)) {
        bookstoreName = bookstore.name;
      }
    }
    soFar[input_index]["name"] = bookstoreName;
    setBookstoresToTransfer(soFar);

    const element = document.getElementById(`bookstore-select-${input_index}`);
    if (e.target.value === "null") {
      if (element.classList.contains("selected") === true) {
        element.classList.remove("selected");
      }
    } else {
      if (element.classList.contains("selected") === false) {
        element.classList.add("selected");
      }
    }
  };

  function updateQuantity(e, input_index) {
    let soFar = [...bookstoresToTransfer];
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }
    soFar[input_index]["quantity"] = e.target.value;
    setBookstoresToTransfer(soFar);
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
    let errorsList = []
    const expectationsBookstore = {
      type: "string",
      presence: "not empty",
      value: bookstoreNamesList
    }
    const expectationsQuantity = {
      type: "number",
      presence: "not empty",
      range: "positive",
      maximum: clickedRow.current
    }

    let totalQuantities = 0;
    const quantityElements = document.querySelectorAll('.transfer-quantity');

    for (let i = 0; i < bookstoresToTransfer.length; i++) {
      const bookstoreRef = document.getElementById(`bookstore-select-${i}`);
      const quantityRef = document.getElementById(`quantity-select-${i}`);

      const errorsBookstore = checkForErrors(
        "librería",
        bookstoresToTransfer[i].name,
        expectationsBookstore,
        bookstoreRef
      );
      if (errorsBookstore.length > 0) {
        errorsList.push(errorsBookstore);
      };

      const errorsQuantity = checkForErrors(
        "cantidad",
        bookstoresToTransfer[i].quantity,
        expectationsQuantity,
        quantityRef
      )
      if (errorsQuantity.length > 0) {
        errorsList.push(errorsQuantity);
      };
      totalQuantities += bookstoresToTransfer[i].quantity
    }

    if (totalQuantities > clickedRow.current) {
      errorsList.push([`El total de las cantidades es superior a lo disponible.`]);
      for (const element of quantityElements) {
        if (element.classList.contains("error-inputs")) {
          element.classList.add("error-inputs");
        }
      }
    }

    setErrors(prev => [...prev, errorsList]);
    return errorsList
  }

  async function sendToServer() {
    try {
      for (let i = 0; i < bookstoresToTransfer.length; i++) {
        const response = await fetch('http://localhost:3000/admin/transfer', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
          body: JSON.stringify({
            bookstoreTo: bookstoresToTransfer[i].name,
            bookstoreToId: bookstoresToTransfer[i].bookstoreId,
            bookstoreFromId: clickedRow.bookstoreId,
            quantity: bookstoresToTransfer[i].quantity,
            inventoryFromId: clickedRow.id,
            bookId: clickedRow.bookId
          }),
        });

        if (response.ok === false) {
          const error = await response.json();
          console.log(error);
          if (error.message) {
            setErrors(prev => [...prev, error.message]);
            return;
          }
          const alertMessage = 'No se pudó crear una nueva transferencia.';
          closeModal(globalFilter, false, alertMessage, "error");
        } else {
          const alertMessage = `Una nueva transferencia ha sido creada.`;
          closeModal(globalFilter, true, alertMessage, "confirmation");
        }
      }
    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva transferencia</p>
        <p>{clickedRow && clickedRow.book.title }</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="global-form">
        {bookstoresToTransfer.map((bookstore, index) => (
          <div
            key={index}
            className="transfer-dropdown">
            <select
              className="select-transfer"
              id={`bookstore-select-${index}`}
              onChange={(e) => dropDownChange(e, index)}>
              <option
                key={index}
                value="null">
                Libreria
              </option>
              {existingBookstores && existingBookstores.map((bookstore, index) => (
                <option
                  key={index}
                  value={`${bookstore.id}`}>
                  {bookstore.name}
                </option>
                ))};
            </select>
            <input
              type='text'
              placeholder="Cantidad"
              className="global-input transfer-quantity"
              id={`quantity-select-${index}`}
              onChange={(e) => updateQuantity(e, index)}>
            </input>
            <div className="additional-transfer-buttons">
            <Tooltip message={tooltipMessage} x={x} y={y}/>
            <FontAwesomeIcon icon={faCirclePlus} onClick={addOtherBookstore}
              id={`plus-icon-${index}`}
              onMouseEnter={() => toggleTooltip(
                "Añadir otra transferencia",
                `plus-icon-${index}`)}
              onMouseLeave={() => toggleTooltip(
                "Añadir otra transferencia",
                `plus-icon-${index}`)}
              className="button-icon transfer"/>
            {bookstoresToTransfer.length > 1 &&
              <>
                <Tooltip
                  message={tooltipMessage}
                  x={x}
                  y={y}/>
                <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeOtherBookstore(index)}
                  id={`cross-icon-${index}`}
                  onMouseEnter={() => toggleTooltip(
                    "Eliminar la transferencia",
                    `cross-icon-${index}`)}
                  onMouseLeave={() => toggleTooltip(
                    "Eliminar la transferencia",
                    `cross-icon-${index}`)}
                  className="button-icon transfer"/>
              </>}
            </div>
          </div>
        ))}
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
