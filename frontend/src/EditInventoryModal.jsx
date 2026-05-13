import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditInventoryModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState(clickedRow.book.title);
  const [bookId, setBookId] = useState(clickedRow.bookId);
  const [bookstore, setBookstore] = useState(clickedRow.bookstore.name);
  const [bookstoreId, setBookstoreId] = useState(clickedRow.bookstoreId);
  const [price, setPrice] = useState(clickedRow.price);
  // const [inicial, setInicial] = useState(clickedRow.initial);
  // const [disponible, setDisponible] = useState(clickedRow.current);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  // const inicialRef = useRef();
  // const disponibleRef = useRef();
  const priceRef = useRef();

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
      const response = await fetch(`${baseURL}/api/admin/books/existingBooks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setExistingBooks(data);
      } else {
        console.error("There was an error fetching existing books:", response.status)
      }

    } catch (error) {
      console.error(error)
    }
  }

  async function fetchExistingBookstores() {
    try {
      const response = await fetch(`${baseURL}/api/admin/bookstores/existingBookstores`, {
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
          if (existingBookstoreCopy[i].name === clickedRow.bookstore.name) {
            existingBookstoreCopy.splice(i, 1);
          }
        }
        existingBookstoreCopy.splice(0, 0, 
          {"id": clickedRow.bookstoreId, "name": clickedRow.bookstore.name})
        setExistingBookstores(existingBookstoreCopy);
      } else {
        console.error("There was an error fetching the exisiting bookstores:", response.status)
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
    //   type: "string",
    //   presence: "not empty",
    //   length: 100,
    //   value: bookTitlesList
    // };
    // const expectationsBookstore = {
    //   type: "string",
    //   presence: "not empty",
    //   length: 50,
    //   value: bookstoreNamesList
    // };
    // const expectationsInicial = {
    //   type: "number",
    //   presence: "not empty",
    //   range: "positive"
    // };
    const expectationsPrice = {
      type: "number",
      presence: "not empty",
      range: "positive"
    };

    // const errorsBook = checkForErrors("Libro", book, expectationsBook, bookRef);
    // const errorsBookstore = checkForErrors("La libreria", bookstore, expectationsBookstore, bookstoreRef, 'a');
    // const errorsPais = checkForErrors("El pais", country, expectationsPais, countryRef, "o");
    // const errorsInicial = checkForErrors("La cantidad inicial", parseInt(inicial), expectationsInicial, inicialRef, "a");
    // const errorsDisponible = checkForErrors("La cantidad disponible", parseInt(inicial), expectationsInicial, inicialRef, "a");
    // const errorInputs = [errorsBook, errorsBookstore, errorsPais, errorsInicial];
    const errorsPrice = checkForErrors("El precio", price, expectationsPrice, priceRef, "o");
    const errorInputs = [errorsPrice];
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
      const response = await fetch(`${baseURL}/api/admin/inventory/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          book: bookId,
          bookstore: bookstoreId,
          // inicial: inicial,
          // disponible: disponible,
          price: price
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó editar el inventario.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `El inventario ha sido editado con exito.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Editar inventario</p>
        <p className="form-subtitle">{clickedRow.book.title} de {clickedRow.bookstore.name}</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form className="global-form">
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Librería *</label>
          <select onChange={(e) => dropDownChange(e, "Bookstore")}
            className="select-global" ref={bookstoreRef}>
            {existingBookstores && existingBookstores.map((bookstore, index) => (
              <option key={index} value={bookstore.title}>{bookstore.name}</option>
            ))}
          </select>
        </div> */}
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Inventario inicial *</label>
          <input type="text" placeholder="Cantidad inicial de libros"
            className="global-input" value={inicial}
            ref={inicialRef} onChange={(e) => setInicial(e.target.value)}></input>
        </div> */}
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Inventario disponible *</label>
          <input type="text" placeholder="Cantidad disponible de libros"
            className="global-input" value={disponible}
            ref={disponibleRef} onChange={(e) => setDisponible(e.target.value)}></input>
        </div> */}
        <div className="modal-form-line">
          <label className="modal-form-label">Precio</label>
          <input type='text' value={price}
            className="global-input" id="adding-book-price"
            ref={priceRef}
            onChange={(e) => setPrice(e.target.value)}></input>
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

export default EditInventoryModal;
