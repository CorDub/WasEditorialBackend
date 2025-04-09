import { useEffect, useState, useRef } from "react";
import Tooltip from "./Tooltip";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import useCheckAdmin from "./customHooks/useCheckAdmin";

function AddingTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const [bookstoresToTransfer, setBookstoresToTransfer] = useState([null]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [bookstoreNamesList, setBookstoresNamesList] = useState([]);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [errors, setErrors] = useState([]);
  const bookstoreRef = useRef();
  const quantityRef = useRef();

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
        setExistingBookstores(data);
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchExistingBookstores();
  }, []);

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
    // const newBookstore = {
    //   bookstoreId: e.target.value
    // }
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }
    soFar[input_index]["bookstoreId"] = e.target.value;
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
      range: "positive"
    }

    // const errorsQuantity = checkForErrors("Cantidad inicial", quantity, expectationsCantidad, quantityRef);
    // const errorInputs = [errorsQuantity];

    // for (const errorInput of errorInputs) {
    //   if (errorInput.length > 0) {
    //     errorsList.push(errorInput);
    //     setErrors(prev => [...prev, errorInput]);
    //   }
    // }

    // return errorsList

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
            className="book-edit-author-dropdown">
            <select
              className="select-global"
              id={`bookstore-select-${index}`}
              ref={bookstoreRef}
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
              className="global-input"
              ref={quantityRef}
              onChange={(e) => updateQuantity(e, index)}>
            </input>
            <div className="additional-authors-buttons">
            <Tooltip message={tooltipMessage} x={x} y={y}/>
            <FontAwesomeIcon icon={faCirclePlus} onClick={addOtherBookstore}
              id={`plus-icon-${index}`}
              onMouseEnter={() => toggleTooltip(
                "Añadir una librería",
                `plus-icon-${index}`)}
              onMouseLeave={() => toggleTooltip(
                "Añadir una librería",
                `plus-icon-${index}`)}
              className="button-icon"/>
            {bookstoresToTransfer.length > 1 &&
              <>
                <Tooltip
                  message={tooltipMessage}
                  x={x}
                  y={y}/>
                <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeOtherBookstore(index)}
                  id={`cross-icon-${index}`}
                  onMouseEnter={() => toggleTooltip(
                    "Eliminar la librería",
                    `cross-icon-${index}`)}
                  onMouseLeave={() => toggleTooltip(
                    "Eliminar la librería",
                    `cross-icon-${index}`)}
                  className="button-icon"/>
              </>}
            </div>
          </div>
        ))}
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
