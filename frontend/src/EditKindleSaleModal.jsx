import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { convertISOString } from "../../backend/utils";

function EditKindleSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [errors, setErrors] = useState([]);
  const [existingBooks, setExistingBooks] = useState([]);
  const [book, setBook] = useState(clickedRow.bookId);
  const [quantityEbook, setQuantityEbook] = useState(clickedRow.quantityEbook);
  const [quantityPod, setQuantityPod] = useState(clickedRow.quantityPod);
  const bookRef = useRef();
  const quantityEbookRef = useRef();
  const quantityPodRef = useRef();
  const dateCutRef = useRef();
  const [dateCut, setDateCut] = useState(new Date(clickedRow.dateCut));
  const [datePay, setDatePay] = useState(new Date(clickedRow.datePay));
  const datePayRef = useRef();
  const [regalias, setRegalias] = useState(clickedRow.regalias);
  const regaliasRef = useRef();

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

  useEffect(() => {
    async function fetchData() {
      await Promise.all([
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
      type: "number",
      presence: "not empty",
      value: existingBookIds
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
    let errorsQuantityEbook;
    let errorsQuantityPod;
    let errorInputs;
    let errorsDatePay;
    let errorsDateCut;
    let errorsRegalias;

    if (clickedRow) {
      errorsQuantityEbook = checkForErrors("La cantidad", quantityEbook, expectationsCantidad, quantityEbookRef, "a");
      errorsQuantityPod = checkForErrors("La cantidad Pod", quantityPod, expectationsCantidad, quantityPodRef, "a");
      errorInputs = [errorsQuantityEbook];
    } else {
      errorsBook = checkForErrors("El libro", parseInt(book), expectationsBook, bookRef, "o");
      errorsQuantityEbook = checkForErrors("La cantidad Ebook", quantityEbook, expectationsCantidad, quantityEbookRef, "a");
      errorsQuantityPod = checkForErrors("La cantidad Pod", quantityPod, expectationsCantidad, quantityPodRef, "a");
      errorsDatePay = checkForErrors("La fecha de pago", datePay, expectationsDate, datePayRef, "a");
      errorsDateCut = checkForErrors("La fecha de corte", dateCut, expectationsDate, dateCutRef, "a");
      errorsRegalias = checkForErrors("El número de las regalías", regalias, expectationsCantidad, regaliasRef, "o");
      errorInputs = [errorsBook, errorsQuantityEbook, errorsQuantityPod, errorsDatePay, errorsDateCut, errorsRegalias];
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
      const response = await fetch(`${baseURL}/api/admin/kindlesales/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          quantityEbook: quantityEbook,
          quantityPod: quantityPod,
          dateCut: dateCut,
          datePay: datePay,
          regalias: regalias
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó editar una nueva venta.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Una nueva venta ha sido editada.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Editar venta Kindle</p>
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
        <div className="modal-form-line">
          <label className="modal-form-label">Cantidad eBook vendida*</label>
          <input 
            type="text" 
            placeholder="Cantidad eBook vendida*" 
            className="global-input"
            value={quantityEbook}
            ref={quantityEbookRef} 
            onChange={(e) => setQuantityEbook(parseInt(e.target.value))}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Cantidad Pod vendida*</label>
          <input 
            type="text" 
            placeholder="Cantidad pod vendida*" 
            className="global-input"
            value={quantityPod}
            ref={quantityPodRef} 
            onChange={(e) => setQuantityPod(parseInt(e.target.value))}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Fecha de corte</label>
          <input 
            type="date"
            className="global-input"
            ref={dateCutRef}
            onChange={(e) => setDateCut(e.target.value)}
            value={convertISOString(dateCut)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Fecha de pago</label>
          <input 
            type="date"
            className="global-input"
            ref={datePayRef}
            onChange={(e) => setDatePay(e.target.value)}
            value={convertISOString(datePay)}></input>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Regalías*</label>
          <input 
            type="text" 
            placeholder="Regalías*" 
            className="global-input"
            value={regalias}
            ref={regaliasRef} 
            onChange={(e) => setRegalias(parseInt(e.target.value))}></input>
        </div>
        
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Editar</button>
        </div>
      </form>
    </div>
  )
}

export default EditKindleSaleModal;