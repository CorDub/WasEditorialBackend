import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import { convertISOString } from "../../backend/utils";

function AddingSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState([]);
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState("");
  const [bookstore, setBookstore] = useState("");
  // const [country, setCountry] = useState("");
  const [quantity, setQuantity] = useState(0);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  // const countryRef = useRef();
  const quantityRef = useRef();
  const dateRef = useRef();
  const [date, setDate] = useState(new Date());
  // const countries = [
  //   "México", "Estados Unidos",
  //   "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán",
  //   "Bahamas", "Bangladés", "Baréin", "Barbados", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Bélgica",
  //   "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba",
  //   "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini (Suazilandia)", "Etiopía",
  //   "Filipinas", "Finlandia", "Fiyi", "Francia",
  //   "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana",
  //   "Haití", "Honduras", "Hungría",
  //   "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
  //   "Jamaica", "Japón", "Jordania",
  //   "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait",
  //   "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
  //   "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique",
  //   "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda",
  //   "Omán",
  //   "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia",
  //   "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
  //   "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu",
  //   "Ucrania", "Uganda", "Uruguay", "Uzbekistán",
  //   "Vanuatu", "Vaticano", "Venezuela", "Vietnam",
  //   "Yemen",
  //   "Zambia", "Zimbabue"
  // ];

  async function fetchInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function getExistingBooks() {
    try {
      const response = await fetch(`${baseURL}/admin/existingBooks`, {
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
      const response = await fetch(`${baseURL}/admin/existingBookstores`, {
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
        fetchInventories(),
        getExistingBooks(),
        getExistingBookstores()
      ]);
    }

    fetchData();
  }, []);

  function dropDownChange(e, input_name, input_index) {

    const inputs = {
      "Book": {
        "function": setBook,
        "element": bookRef
      },
      "Bookstore": {
        "function": setBookstore,
        "element": bookstoreRef
      },
      // "Country": {
      //   "function": setCountry,
      //   "element": countryRef
      // }
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
    let existingBookstoreIds = []
    for (const bookstore of existingBookstores) {
      existingBookstoreIds.push(bookstore.id)
    }

    const expectationsBook = {
      type: "number",
      presence: "not empty",
      // length: 100,
      value: existingBookIds
    };
    const expectationsBookstore = {
      type: "number",
      presence: "not empty",
      // length: 50,
      value: existingBookstoreIds
    };
    // const expectationsPais = {
    //   type: "string",
    //   presence: "not empty",
    //   length: 50,
    //   value: countries
    // };
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
    // let errorsPais;
    let errorsQuantity;
    let errorInputs;
    let errorsDate;

    if (clickedRow) {
      errorsQuantity = checkForErrors("La cantidad", quantity, expectationsCantidad, quantityRef, "a");
      errorInputs = [errorsQuantity];
    } else {
      errorsBook = checkForErrors("El libro", parseInt(book), expectationsBook, bookRef, "o");
      errorsBookstore = checkForErrors("La librería", parseInt(bookstore) , expectationsBookstore, bookstoreRef, "a");
      // errorsPais = checkForErrors("El país", country, expectationsPais, countryRef, "o");
      errorsQuantity = checkForErrors("La cantidad", quantity, expectationsCantidad, quantityRef, "a");
      errorsDate = checkForErrors("La fecha", date, expectationsDate, dateRef, "a");
      errorInputs = [errorsBook, errorsBookstore, errorsQuantity, errorsDate];
    }

    // console.log("errorInputs", errorInputs);

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
      const response = await fetch(`${baseURL}/admin/sale`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          book: parseInt(book),
          bookstore: parseInt(bookstore),
          // country: country,
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
      // setCountry(clickedRow.country);
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
           {/* <select onChange={(e) => dropDownChange(e, "Country")}
             className="select-global" ref={countryRef}>
             <option value="null">Selecciona pais*</option>
             {countries && countries.map((country, index) => (
               <option key={index} value={country}>{country}</option>
             ))}
           </select> */}
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
