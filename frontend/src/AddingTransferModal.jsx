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
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [bookstoresToTransfer, setBookstoresToTransfer] = useState([null]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [bookstoreNamesList, setBookstoresNamesList] = useState([]);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [errors, setErrors] = useState([]);
  const [transferType, setTransferType] = useState('');

  console.log("clickedRow", clickedRow)
  
  useEffect(() => {
    if (clickedRow.bookstoreId === 1) {
      setTransferType('send')
    } else {
      setTransferType('return')
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
      const response = await fetch(`${baseURL}/api/admin/existingBookstores`, {
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

  function dropDownChange(e, input_index, type) {
    // copies the current bookstoresToTransfer
    let soFar = [...bookstoresToTransfer];

    // create a new object if bookstoresToTransfer is empty
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }

    // add the value to the new object depending on type
    if (type === "bookstore") {
      soFar[input_index]["bookstoreId"] = e.target.value;
      // find and add the bookstore name to the new object based on the bookstoreId
      let bookstoreName = [];
      for (const bookstore of existingBookstores) {
        if (bookstore.id === parseInt(e.target.value)) {
          bookstoreName = bookstore.name;
        }
      }
      soFar[input_index]["name"] = bookstoreName;
    } else {
      soFar[input_index]["country"] = e.target.value;
    }

    setBookstoresToTransfer(soFar);
    // Change the appearance to make it look selected
    const element = document.getElementById(`${type}-select-${input_index}`);
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

    if (transferType === "return") {
      soFar[input_index]["name"] = 'WAS Editorial';
      soFar[input_index]["bookstoreId"] = 1;
      // soFar[input_index]["country"] = "México";
      soFar[input_index]["fecha"] = new Date()
    };

    setBookstoresToTransfer(soFar);
  }

  function updateFecha(e, input_index) {
    let soFar = [...bookstoresToTransfer];
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }

    soFar[input_index]["fecha"] = e.target.value;
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

    // Check if bookstoresToTransfer is null
    if (bookstoresToTransfer[0] === null) {
      errorsList.push(["Por favor elige una librería y cantidad"]);
      setErrors(errorsList);
      return errorsList;
    }

    // Check if we're not making a transfer to the same inventory first
    // for (const transfer of bookstoresToTransfer) {
    //   if (parseInt(transfer.bookstoreId) === clickedRow.bookstoreId
    //     && transfer.country === clickedRow.country) {
    //       errorsList.push(["No se puede transferir al mismo inventario"]);
    //       setErrors(errorsList);
    //       console.log("blocked");
    //       return errorsList;
    //   }
    // }

    // Set expectations for each field being tested
    const expectationsBookstore = {
      type: "string",
      presence: "not empty",
      // value: bookstoreNamesList
    }
    const expectationsQuantity = {
      type: "number",
      presence: "not empty",
      range: "positive",
      maximum: clickedRow.current
    }
    // const expectationsCountry = {
    //   type: "string",
    //   presence: "not empty",
    //   value: countries
    // }
    let totalQuantities = 0;
    const quantityElements = document.querySelectorAll('.transfer-quantity');

    // for each bookstore within BookstoresToTransfer
    // - prepare the ref
    // send everything to global function checkForErrrors
    // if the result come back positive, add all errors to the list
    for (let i = 0; i < bookstoresToTransfer.length; i++) {
      if (transferType === "send") {
        const bookstoreRef = document.getElementById(`bookstore-select-${i}`);
        const errorsBookstore = checkForErrors(
          "Librería",
          bookstoresToTransfer[i].name,
          expectationsBookstore,
          bookstoreRef,
          'a'
        );
        if (errorsBookstore.length > 0) {
          errorsList.push(errorsBookstore);
        };

        // const countryRef = document.getElementById(`country-select-${i}`);
        // const errorsCountry = checkForErrors(
        //   "El país",
        //   bookstoresToTransfer[i].country,
        //   expectationsCountry,
        //   countryRef,
        //   "o"
        // )
        // if (errorsCountry.length > 0) {
        //   errorsList.push(errorsCountry);
        // }
      };

      const quantityRef = document.getElementById(`quantity-select-${i}`);
      // console.log("quantityRef", quantityRef);
      const errorsQuantity = checkForErrors(
        "Cantidad",
        bookstoresToTransfer[i].quantity,
        expectationsQuantity,
        quantityRef,
        "a"
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

  console.log("clickedRow", clickedRow)

  async function sendToServer() {
    try {
      for (let i = 0; i < bookstoresToTransfer.length; i++) {
        const response = await fetch(`${baseURL}/api/admin/transfer`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
          body: JSON.stringify({
            // bookstoreTo: bookstoresToTransfer[i].name,
            bookstoreToId: bookstoresToTransfer[i].bookstoreId,
            // bookstoreFromId: clickedRow.bookstoreId,
            quantity: bookstoresToTransfer[i].quantity,
            inventoryFromId: clickedRow.id,
            // bookId: clickedRow.bookId,
            type: transferType,
            deliveryDate: bookstoresToTransfer[i].fecha
            // country: bookstoresToTransfer[i].country
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

  // useEffect(() => {
  //   console.log(bookstoresToTransfer)
  // }, [bookstoresToTransfer])

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
          {bookstoresToTransfer.map((bookstore, index) => (
            <div
              key={index}
              className="centered-entrega">
              <select
                className="global-input"
                id={`bookstore-select-${index}`}
                onChange={(e) => dropDownChange(e, index, 'bookstore')}>
                <option
                  key={index}
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
              {/* <select
                className="select-transfer"
                id={`country-select-${index}`}
                onChange={(e) => dropDownChange(e, index, 'country')}>
                <option
                  key={index}
                  value="null">
                  País*
                  </option>
                {countries.map((country, index) => (
                  <option
                    key={index}
                    value={country}>
                      {country}
                    </option>
                ))}
              </select> */}
              <input
                type="date"
                className="global-input"
                id={`fecha-${index}`}
                onChange={(e) => updateFecha(e, index)}>
              </input>
              <input
                type='text'
                placeholder="Cantidad*"
                className="global-input transfer-quantity"
                id={`quantity-select-${index}`}
                onChange={(e) => updateQuantity(e, index)}>
              </input>
              {/* <div className="additional-transfer-buttons">
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
              </div> */}
            </div>
          ))}</>)
          :
          <>
            <input
              type='text'
              placeholder="Cantidad"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              className="global-input transfer-quantity"
              id={`quantity-select-0`}
              onChange={(e) => updateQuantity(e, 0)}>
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
