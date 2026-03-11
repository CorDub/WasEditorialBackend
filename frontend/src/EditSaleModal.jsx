import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { convertISOString } from "../../backend/utils";

function EditSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState(clickedRow.inventory.book.title);
  const [bookId, setBookId] = useState(clickedRow.inventory.bookId);
  const [bookstore, setBookstore] = useState(clickedRow.inventory.bookstore.name);
  const [bookstoreId, setBookstoreId] = useState(clickedRow.inventory.bookstoreId);
  // const [country, setCountry] = useState(clickedRow.inventory.country);
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  // const countryRef = useRef();
  const quantityRef = useRef();
  const dateStrRef = useRef();
  const [dateStr, setDateStr] = useState(clickedRow.dateStr);

  let bookTitlesList = []
  for (const book of existingBooks) {
    bookTitlesList.push(book.title)
  }
  let bookstoreNamesList = []
  for (const bookstore of existingBookstores) {
    bookstoreNamesList.push(bookstore.name)
  }

  useEffect(() => {
    const selectedBook = existingBooks.find(item => item.title === book);
    setBookId(selectedBook && selectedBook.id);
  }, [book, existingBooks])

  useEffect(() => {
    const selectedBookstore = existingBookstores.find(item => item.name === bookstore);
    setBookstoreId(selectedBookstore && selectedBookstore.id);
  }, [bookstore, existingBookstores])

  async function fetchExistingBooks() {
    try {
      const response = await fetch(`${baseURL}/api/admin/existingBooks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const existingBooksCopy = [...data];
        for (let i = 0; i < existingBooksCopy.length; i++) {
          if (existingBooksCopy[i].title === clickedRow.inventory.book.title) {
            existingBooksCopy.splice(i, 1);
          }
        }
        existingBooksCopy.splice(0, 0, 
          {"id": clickedRow.inventory.bookId, "title": clickedRow.inventory.book.title})
        setExistingBooks(existingBooksCopy);
      } else {
        console.log("There was an error fetching existing books:", response.status)
      }

    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      await Promise.all([
        fetchExistingBooks(),
        fetchExistingBookstores()
      ]);
    }

    fetchData();
  }, [])

  async function fetchExistingBookstores() {
    try {
      const response = await fetch(`${baseURL}/api/admin/existingBookstores`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const existingBookstoreCopy = [...data];
        for (let i = 0; i < existingBookstoreCopy.length; i++) {
          if (existingBookstoreCopy[i].name === clickedRow.inventory.bookstore.name) {
            existingBookstoreCopy.splice(i, 1);
          }
        }
        existingBookstoreCopy.splice(0, 0, 
          {"id": clickedRow.inventory.bookstoreId, "name": clickedRow.inventory.bookstore.name})
        setExistingBookstores(existingBookstoreCopy);
      } else {
        console.log("There was an error fetching the exisiting bookstores:", response.status)
      }

    } catch (error) {
      console.error(error)
    }
  }

  // function dropDownChange(e, input_name, input_index) {

  //   const inputs = {
  //     "Book": {
  //       "function": setBook,
  //       "element": bookRef
  //     },
  //     "Bookstore": {
  //       "function": setBookstore,
  //       "element": bookstoreRef
  //     },
  //     // "Country": {
  //     //   "function": setCountry,
  //     //   "element": countryRef
  //     // }
  //   }

  //   if (input_index !== undefined) {
  //     inputs[input_name]["function"](input_index, e);
  //     if (e.target.value === "null") {
  //       if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
  //         inputs[input_name]["element"].current.classList.remove("selected")
  //       };
  //       return;
  //     } else {
  //       // inputs[input_name]["function"](input_index, e);
  //       if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
  //         inputs[input_name]["element"].current.classList.add("selected")
  //       };
  //       return;
  //     }
  //   };

  //   if (e.target.value === "null") {
  //     inputs[input_name]["function"](null);
  //     if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
  //       inputs[input_name]["element"].current.classList.remove("selected")
  //     };
  //   } else {
  //     inputs[input_name]["function"](e.target.value);
  //     if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
  //       inputs[input_name]["element"].current.classList.add("selected")
  //     };
  //   };
  // }

  function checkInputs() {
    let errorsList = []
    // const expectationsBook = {
    //   presence: "not empty",
    //   type: "string",
    //   length: 100,
    //   value: bookTitlesList
    // };
    // const expectationsBookstore = {
    //   presence: "not empty",
    //   type: "string",
    //   length: 50,
    //   value: bookstoreNamesList
    // };
    // const expectationsPais = {
    //   type: "string",
    //   presence: "not empty",
    //   length: 50,
    //   value: countries
    // };
    const expectationsCantidad = {
      presence: "not empty",
      type: "number",
      range: "positive"
    }
    const expectationsDateStr= {
      presence: "not empty",
      type: "string",
      range: "no future"
    }

    // const errorsBook = checkForErrors("El libro", book, expectationsBook, bookRef, "o");
    // const errorsBookstore = checkForErrors("La libreria", bookstore, expectationsBookstore, bookstoreRef, "a");
    // const errorsPais = checkForErrors("El pais", country, expectationsPais, countryRef, "o");
    const errorsQuantity = checkForErrors("Cantidad", parseInt(quantity), expectationsCantidad, quantityRef, "a");
    const errorsDateStr = checkForErrors("Fecha", dateStr, expectationsDateStr, dateStrRef, 'a');
    const errorInputs = [errorsQuantity, errorsDateStr];
    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/sale/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          // id: clickedRow.id,
          book: bookId,
          bookstore: bookstoreId,
          // country: country,
          quantity: parseInt(quantity),
          dateStr: dateStr
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó editar la venta.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `La venta ha sido editada con exito.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Editar venta</p>
        <p className="form-subtitle">{clickedRow.completeInventory}</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form className="global-form">
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Título *</label>
          <select onChange={(e) => dropDownChange(e, "Book")}
            className="select-global" ref={bookRef}>
            {existingBooks && existingBooks.map((book, index) => (
              <option key={index} value={book.title}>{book.title}</option>
            ))}
          </select>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Librería *</label>
          <select onChange={(e) => dropDownChange(e, "Bookstore")}
            className="select-global" ref={bookstoreRef}>
            {existingBookstores && existingBookstores.map((bookstore, index) => (
              <option key={index} value={bookstore.title}>{bookstore.name}</option>
            ))}
          </select>
        </div> */}
        {/* <div className="modal-form-line">
          <label className="modal-form-label">País *</label>
          <select onChange={(e) => dropDownChange(e, "Country")}
            className="select-global" ref={countryRef}>
            {countries && countries.map((country, index) => (
              <option key={index} value={country}>{country}</option>
            ))}
          </select>
        </div> */}
        <div className="modal-form-line">
          <label className="modal-form-label">Cantidad *</label>
          <input type="text" placeholder="Cantidad vendida" className="global-input"
            ref={quantityRef} value={quantity}
            inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
            onChange={(e) => setQuantity(e.target.value)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Fecha *</label>
          <input 
            type="date"
            placeholder="Fecha"
            className="global-input"
            ref={dateStrRef}
            onChange={(e) => setDateStr(e.target.value)}
            value={dateStr}></input>
        </div>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Confirmar</button>
        </div>
      </form>
    </div>
  )
}

export default EditSaleModal
