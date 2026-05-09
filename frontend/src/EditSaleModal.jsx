import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

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
  const [quantity, setQuantity] = useState(clickedRow.quantity);
  const bookRef = useRef();
  const bookstoreRef = useRef();
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
        console.error("There was an error fetching existing books:", response.status)
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
        console.error("There was an error fetching the exisiting bookstores:", response.status)
      }

    } catch (error) {
      console.error(error)
    }
  }

  function checkInputs() {
    let errorsList = []
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
          book: bookId,
          bookstore: bookstoreId,
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
