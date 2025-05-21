import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState([]);
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState("");
  const [bookstore, setBookstore] = useState("");
  const [country, setCountry] = useState("");
  const [quantity, setQuantity] = useState(1);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  const countryRef = useRef();
  const quantityRef = useRef();
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

  useEffect(() => {
    fetchInventories();
  }, []);

  useEffect(() => {
    let inventoryBooks = [];
    let inventoryBookstores = [];
    for (const inventory of data) {
      inventoryBooks.push(inventory.book.title);
      inventoryBookstores.push(inventory.bookstore.name);
    }
    setExistingBooks(inventoryBooks);
    setExistingBookstores(inventoryBookstores);
  }, [data])

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
      "Country": {
        "function": setCountry,
        "element": countryRef
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
        // inputs[input_name]["function"](input_index, e);
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
    const expectationsBook = {
      type: "string",
      presence: "not empty",
      length: 100,
      value: existingBooks
    };
    const expectationsBookstore = {
      type: "string",
      presence: "not empty",
      length: 50,
      value: existingBookstores
    };
    const expectationsPais = {
      type: "string",
      presence: "not empty",
      length: 50,
      value: countries
    };
    const expectationsCantidad = {
      type: "number",
      presence: "not empty",
      range: "positive"
    }

    let errorsBook;
    let errorsBookstore;
    let errorsPais;
    let errorsQuantity;
    let errorInputs;

    if (clickedRow) {
      errorsQuantity = checkForErrors("Cantidad inicial", quantity, expectationsCantidad, quantityRef);
      errorInputs = [errorsQuantity];
    } else {
      errorsBook = checkForErrors("Libro", book, expectationsBook, bookRef);
      errorsBookstore = checkForErrors("Libreria", bookstore, expectationsBookstore, bookstoreRef);
      errorsPais = checkForErrors("Pais", country, expectationsPais, countryRef);
      errorsQuantity = checkForErrors("Cantidad inicial", quantity, expectationsCantidad, quantityRef);
      errorInputs = [errorsBook, errorsBookstore, errorsPais, errorsQuantity];
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
      const chosenInventory = data.find(inventory => inventory.book.title === book && inventory.bookstore.name === bookstore);
      console.log(chosenInventory);

      const response = await fetch(`${baseURL}/admin/sale`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          book: chosenInventory.bookId,
          bookstore: chosenInventory.bookstoreId,
          country: country,
          quantity: quantity
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
      setBook(clickedRow.book.title);
      setBookstore(clickedRow.bookstore.name);
      setCountry(clickedRow.country);
    }
  }, [clickedRow])

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva venta</p>
      </div>
      <form className="global-form">
        {clickedRow ?
          null :
           <>
           <select onChange={(e) => dropDownChange(e, "Book")}
             className="select-global" ref={bookRef}>
             <option value="null">Selecciona libro</option>
             {existingBooks && existingBooks.map((book, index) => (
               <option key={index} value={book}>{book}</option>
             ))}
           </select>
           <select onChange={(e) => dropDownChange(e, "Bookstore")}
             className="select-global" ref={bookstoreRef}>
             <option value="null">Selecciona libreria</option>
             {existingBookstores && existingBookstores.map((bookstore, index) => (
               <option key={index} value={bookstore}>{bookstore}</option>
             ))}
           </select>
           <select onChange={(e) => dropDownChange(e, "Country")}
             className="select-global" ref={countryRef}>
             <option value="null">Selecciona pais</option>
             {countries && countries.map((country, index) => (
               <option key={index} value={country}>{country}</option>
             ))}
           </select>
         </>
        }
        <input type="text" placeholder="Cantidad vendida" className="global-input"
          ref={quantityRef} onChange={(e) => setQuantity(parseInt(e.target.value))}></input>
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
