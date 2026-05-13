import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { 
  today,
  getDateCutStr 
} from "../../backend/utils";

function AddingKindleSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  // const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [existingBooks, setExistingBooks] = useState([]);
  const [book, setBook] = useState("");
  const [quantityEbook, setQuantityEbook] = useState(0);
  const [quantityPod, setQuantityPod] = useState(0);
  const bookRef = useRef();
  const quantityEbookRef = useRef();
  const quantityPodRef = useRef();
  const [dateCutStr, setDateCutStr] = useState(getDateCutStr(today()));
  const [datePayStr, setDatePayStr] = useState(today());
  const datePayStrRef = useRef();
  const [regalias, setRegalias] = useState(0);
  const regaliasRef = useRef();

  useEffect(() => {
    setDateCutStr(getDateCutStr(datePayStr))
  }, [datePayStr])

  async function getExistingBooks() {
    try {
      const response = await fetch(`${baseURL}/api/admin/books/existingBooks`, {
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

  useEffect(() => {
    async function fetchData() {
      await Promise.all([
        // fetchInventories(),
        getExistingBooks()
      ]);
    }

    fetchData();
  }, []);

  function dropDownChange(e, input_name, input_index) {

    const inputs = {
      "Book": {
        "function": setBook,
        "element": bookRef
      }
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
      inputs[input_name]["function"](e.target.value);
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
    const expectationsBook = {
      presence: "not empty",
      type: "number",
      value: existingBookIds
    };
    const expectationsCantidad = {
      presence: "not empty",
      type: "number",
      range: "positive"
    }
    const expectationsDateStr = {
      presence: "not empty",
      type: "string",
      range: "no future"
    }

    let errorsBook;
    let errorsQuantityEbook;
    let errorsQuantityPod;
    let errorInputs;
    let errorsDatePayStr;
    // let errorsDateCutStr;
    let errorsRegalias;

    if (clickedRow) {
      errorsQuantityEbook = checkForErrors("Cantidad", quantityEbook, expectationsCantidad, quantityEbookRef, "a");
      errorsQuantityPod = checkForErrors("Cantidad Pod", quantityPod, expectationsCantidad, quantityPodRef, "a");
      errorInputs = [errorsQuantityEbook];
    } else {
      errorsBook = checkForErrors("Libro", parseInt(book), expectationsBook, bookRef, "o");
      errorsQuantityEbook = checkForErrors("Cantidad Ebook", (quantityEbook + quantityPod), expectationsCantidad, quantityEbookRef, "a");
      errorsQuantityPod = checkForErrors("Cantidad Pod", (quantityPod + quantityEbook), expectationsCantidad, quantityPodRef, "a");
      errorsDatePayStr = checkForErrors("Fecha de pago", datePayStr, expectationsDateStr, datePayStrRef, "a");
      // errorsDateCutStr = checkForErrors("Fecha de corte", dateCutStr, expectationsDateStr, dateCutStrRef, "a");
      errorsRegalias = checkForErrors("Número de las regalías", regalias, expectationsCantidad, regaliasRef, "o");
      errorInputs = [errorsBook, errorsQuantityEbook, errorsQuantityPod, errorsDatePayStr, errorsRegalias];
      // if (dateCutStr >= datePayStr) {
      //   errorInputs.push("La fecha de corte no puede estar después de la fecha de pago")
      // };
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
      const response = await fetch(`${baseURL}/api/admin/kindlesales/kindlesales`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          book: parseInt(book),
          quantityEbook: quantityEbook,
          quantityPod: quantityPod,
          dateCutStr: dateCutStr,
          datePayStr: datePayStr,
          regalias: regalias
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear una nueva venta Kindle.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva venta Kindle ha sido creada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (clickedRow) {
      setBook(clickedRow.bookId);
    }
  }, [clickedRow])

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva venta Kindle</p>
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
         </>
        }
        <input type="text" placeholder="Cantidad eBook vendida*" className="global-input"
          inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          ref={quantityEbookRef} onChange={(e) => setQuantityEbook(parseInt(e.target.value))}></input>
        <input type="text" placeholder="Cantidad pod vendida*" className="global-input"
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          ref={quantityPodRef} onChange={(e) => setQuantityPod(parseInt(e.target.value))}></input>
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Fecha de corte</label>
          <input 
            type="date"
            className="global-input"
            ref={dateCutStrRef}
            onChange={(e) => setDateCutStr(e.target.value)}
            value={dateCutStr}></input>
        </div> */}
        <div className="modal-form-line">
          <label className="modal-form-label">Fecha de pago</label>
          <input 
            type="date"
            className="global-input"
            ref={datePayStrRef}
            onChange={(e) => setDatePayStr(e.target.value)}
            value={datePayStr}></input>
        </div>
        <input type="text" placeholder="Regalías*" className="global-input"
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          ref={regaliasRef} onChange={(e) => setRegalias(parseInt(e.target.value))}></input>
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

export default AddingKindleSaleModal;