import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { convertISOString } from "../../backend/utils";

function AddingSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState("");
  const [bookstore, setBookstore] = useState("");
  const [quantity, setQuantity] = useState(0);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  const quantityRef = useRef();
  const dateRef = useRef();
  const [date, setDate] = useState(new Date());

  async function getExistingBooks() {
    try {
      const response = await fetch(`${baseURL}/api/admin/existingBooks`, {
       method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setExistingBooks(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function getExistingBookstores() {
    try {
      const response = await fetch(`${baseURL}/api/admin/existingBookstores`, {
       method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setExistingBookstores(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    async function fetchData() {
      await Promise.all([
        getExistingBooks(),
        getExistingBookstores()
      ]);
    }

    fetchData();
  }, []);


  function changeValueAndFilter(value, type) {
    if (type === "Book") {
      setBook(parseInt(value))
      let chosenBook;
      for (const book of existingBooks) {
        if (book.id === parseInt(value)) {
          chosenBook = book
          break;
        }
      }

      if (bookstore === "") {
        let filteredList = [];
        for (const inventory of chosenBook.inventories) {
          for (const bookstore of existingBookstores) {
            if (inventory.bookstoreId === bookstore.id) {
              filteredList.push(bookstore)
            }
          }
        }
        setExistingBookstores(filteredList);
        if (!filteredList.includes(bookstore)) {
          setBookstore("");
        }
      } 

    } else if (type === "Bookstore") {
      setBookstore(parseInt(value))
      let chosenBookstore;
      for (const bookstore of existingBookstores) {
        if (bookstore.id === parseInt(value)) {
          chosenBookstore = bookstore
          break;
        }
      }

      if (book === "") {
        let filteredList = [];
        for (const inventory of chosenBookstore.inventories) {
          for (const book of existingBooks) {
            if (inventory.bookId === book.id) {
              filteredList.push(book)
            } 
          }
        }
        setExistingBooks(filteredList);
        if (!filteredList.includes(book)) {
          setBook("");
        }
      }
    }
  }

  function dropDownChange(e, input_name, input_index) {

    const inputs = {
      "Book": {
        "function": changeValueAndFilter,
        "element": bookRef
      },
      "Bookstore": {
        "function": changeValueAndFilter,
        "element": bookstoreRef
      },
    }

    if (input_index !== undefined) {
      inputs[input_name]["function"](input_index, e);
      if (e.target.value === "null") {
        if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
          inputs[input_name]["element"].current.classList.remove("selected")
        };
        return;
      } else {
        if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
          inputs[input_name]["element"].current.classList.add("selected")
        };
        return;
      }
    };

    if (e.target.value === "null") {
      inputs[input_name]["function"](null);
      if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
        inputs[input_name]["element"].current.classList.remove("selected")
      };
    } else {
      inputs[input_name]["function"](e.target.value, input_name);
      if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
        inputs[input_name]["element"].current.classList.add("selected")
      };
    };
  }

  function checkInputs() {
    let errorsList = []
    let existingBookIds = []
    for (const book of existingBooks) {
      existingBookIds.push(book.id)
    }
    let existingBookstoreIds = []
    for (const bookstore of existingBookstores) {
      existingBookstoreIds.push(bookstore.id)
    }

    const expectationsBook = {
      type: "number",
      presence: "not empty",
      value: existingBookIds
    };
    const expectationsBookstore = {
      type: "number",
      presence: "not empty",
      value: existingBookstoreIds
    };
    const expectationsCantidad = {
      type: "number",
      presence: "not empty",
      range: "positive"
    }

    const expectationsDate = {
      type: "datetime",
      presence: "not empty",
      range: "no future"
    }

    let errorsBook;
    let errorsBookstore;
    let errorsQuantity;
    let errorInputs;
    let errorsDate;

    if (clickedRow) {
      errorsQuantity = checkForErrors("La cantidad", quantity, expectationsCantidad, quantityRef, "a");
      errorInputs = [errorsQuantity];
    } else {
      errorsBook = checkForErrors("El libro", parseInt(book), expectationsBook, bookRef, "o");
      errorsBookstore = checkForErrors("La librería", parseInt(bookstore) , expectationsBookstore, bookstoreRef, "a");
      errorsQuantity = checkForErrors("La cantidad", quantity, expectationsCantidad, quantityRef, "a");
      errorsDate = checkForErrors("La fecha", date, expectationsDate, dateRef, "a");
      errorInputs = [errorsBook, errorsBookstore, errorsQuantity, errorsDate];
    }

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
      const response = await fetch(`${baseURL}/api/admin/sale`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          bookId: parseInt(book),
          bookstoreId: parseInt(bookstore),
          quantity: quantity,
          date: date
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear una nueva venta.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva venta ha sido creada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (clickedRow) {
      setBook(clickedRow.bookId);
      setBookstore(clickedRow.bookstoreId);
    }
  }, [clickedRow])

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva venta</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form className="global-form">
        {clickedRow ?
          null :
           <>
           <select onChange={(e) => dropDownChange(e, "Book")}
             className="select-global" ref={bookRef}>
             <option value="null">Selecciona libro*</option>
             {existingBooks && existingBooks.map((book, index) => (
               <option key={index} value={book.id}>{book.title}</option>
             ))}
           </select>
           <select onChange={(e) => dropDownChange(e, "Bookstore")}
             className="select-global" ref={bookstoreRef}>
             <option value="null">Selecciona libreria*</option>
             {existingBookstores && existingBookstores.map((bookstore, index) => (
               <option key={index} value={bookstore.id}>{bookstore.name}</option>
             ))}
           </select>
         </>
        }
        <input type="text" placeholder="Cantidad vendida*" className="global-input"
          ref={quantityRef} onChange={(e) => setQuantity(parseInt(e.target.value))}></input>
        <input 
            type="date"
            placeholder="Fecha"
            className="global-input"
            ref={dateRef}
            onChange={(e) => setDate(e.target.value)}
            value={convertISOString(date)}></input>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
    </div>
  )
}

export default AddingSaleModal;
