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
  const [transferType, setTransferType] = useState('');
  const [deliverToAuthor, setDeliverToAuthor] = useState(false);
  const [note, setNote] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [place, setPlace] = useState('');
  const [person, setPerson] = useState('');
  const countries = [
    "México", "Estados Unidos",
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán",
    "Bahamas", "Bangladés", "Baréin", "Barbados", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Bélgica",
    "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba",
    "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini (Suazilandia)", "Etiopía",
    "Filipinas", "Finlandia", "Fiyi", "Francia",
    "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana",
    "Haití", "Honduras", "Hungría",
    "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
    "Jamaica", "Japón", "Jordania",
    "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait",
    "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
    "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique",
    "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda",
    "Omán",
    "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia",
    "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
    "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu",
    "Ucrania", "Uganda", "Uruguay", "Uzbekistán",
    "Vanuatu", "Vaticano", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabue"
  ];

  useEffect(() => {
    if (clickedRow.bookstoreId === 3) {
      setTransferType('send')
    } else {
      setTransferType('return')
    }
  }, [clickedRow])

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
        // const cleanedUpData = data.filter(bookstore => bookstore.name !== clickedRow.bookstore.name)
        // setExistingBookstores(cleanedUpData);
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

  useEffect(() => {
    console.log(bookstoresToTransfer);
  }, [bookstoresToTransfer])

  function updateQuantity(e, input_index) {
    let soFar = [...bookstoresToTransfer];
    if (!soFar[input_index]) {
      soFar[input_index] = {};
    }

    soFar[input_index]["quantity"] = e.target.value;

    if (transferType === "return") {
      soFar[input_index]["name"] = 'Plataforma Was';
      soFar[input_index]["bookstoreId"] = 3;
    };

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
    // Prepare an error list that will be displayed if any
    let errorsList = []

    // Set expectations for each field being tested
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
    const expectationsCountry = {
      type: "string",
      presence: "not empty",
      value: countries
    }

    let totalQuantities = 0;
    const quantityElements = document.querySelectorAll('.transfer-quantity');

    // for each bookstore within BookstoresToTransfer
    // - prepare the ref
    // send everything to global function checkForErrrors
    // if the result come back positive, add all errors to the list
    for (let i = 0; i < bookstoresToTransfer.length; i++) {
      if (transferType === "send" && !deliverToAuthor) {
        const bookstoreRef = document.getElementById(`bookstore-select-${i}`);
        const errorsBookstore = checkForErrors(
          "librería",
          bookstoresToTransfer[i].name,
          expectationsBookstore,
          bookstoreRef
        );
        if (errorsBookstore.length > 0) {
          errorsList.push(errorsBookstore);
        };
        console.log("errorsBookstore", errorsBookstore);
      };

      const quantityRef = document.getElementById(`quantity-select-${i}`);
      console.log("quantityRef", quantityRef);
      const errorsQuantity = checkForErrors(
        "cantidad",
        bookstoresToTransfer[i].quantity,
        expectationsQuantity,
        quantityRef
      )
      if (errorsQuantity.length > 0) {
        errorsList.push(errorsQuantity);
      };
      console.log("errorsQuantity", errorsQuantity);
      totalQuantities += bookstoresToTransfer[i].quantity

      const countryRef = document.getElementById(`country-select-${i}`);
      const errorsCountry = checkForErrors(
        "país",
        bookstoresToTransfer[i].country,
        expectationsCountry,
        countryRef
      )
      if (errorsCountry.length > 0) {
        errorsList.push(errorsCountry);
      }
      console.log("errorsCountry", errorsCountry);
    }

    console.log("clickedRow.current", clickedRow.current);

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
            bookId: clickedRow.bookId,
            type: transferType,
            note: note,
            deliveryDate: deliveryDate,
            place: place,
            person: person,
            country: bookstoresToTransfer[i].country
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
        <p>{transferType && transferType === "send" ? 'Nueva transferencia' : 'Nueva devolución'}</p>
        <p>{clickedRow && clickedRow.book.title }</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="global-form">
        {transferType === "send" && !deliverToAuthor ? (
          <>
          <div className="transfer-deliver-to-author">
            <p>Entrega al autor?</p>
            <input
              type="checkbox"
              onChange={() => setDeliverToAuthor(!deliverToAuthor)}/>
          </div>
          {bookstoresToTransfer.map((bookstore, index) => (
            <div
              key={index}
              className="transfer-dropdown">
              <select
                className="select-transfer"
                id={`bookstore-select-${index}`}
                onChange={(e) => dropDownChange(e, index, 'bookstore')}>
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
              <select
                className="select-transfer"
                id={`country-select-${index}`}
                onChange={(e) => dropDownChange(e, index, 'country')}>
                <option
                  key={index}
                  value="null">
                  País
                  </option>
                {countries.map((country, index) => (
                  <option
                    key={index}
                    value={country}>
                      {country}
                    </option>
                ))}
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
          ))}</>)
          :
          <>
            <input
              type='text'
              placeholder="Cantidad"
              className="global-input transfer-quantity"
              id={`quantity-select-0`}
              onChange={(e) => updateQuantity(e, 0)}>
            </input>
            <input
              type="date"
              placeholder="Fecha de entrega"
              className="global-input"
              onChange={(e) => setDeliveryDate(e.target.value)}/>
            <input
              type="text"
              placeholder="Lugar (opcional)"
              className="global-input"
              onChange={(e) => setPlace(e.target.value)}/>
            <input
              type="text"
              placeholder="Persona (opcional)"
              className="global-input"
              onChange={(e) => setPerson(e.target.value)}/>
            <input
              type="text"
              placeholder="Comentario para el autor (opcional)"
              className="global-input"
              onChange={(e) => setNote(e.target.value)}/>
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
