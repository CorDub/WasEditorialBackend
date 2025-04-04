import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingInventoryModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);
  const [book, setBook] = useState("");
  const [bookId, setBookId] = useState(null);
  const [bookstore, setBookstore] = useState("");
  const [bookstoreId, setBookstoreId] = useState(null);
  const [country, setCountry] = useState("");
  const [inicial, setInicial] = useState(0);
  const bookRef = useRef();
  const bookstoreRef = useRef();
  const countryRef = useRef();
  const inicialRef = useRef();
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

  // set book title or bookstore name depending on what clickedRow provides
  useEffect(() => {
    if (clickedRow.bookstore) {
      setBookstore(clickedRow.bookstore);
    } else {
      setBook(clickedRow.book);
    }
  }, [clickedRow])

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
      const response = await fetch('http://localhost:3000/admin/existingBooks', {
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
        console.log("There was an error fetching existing books:", response.status)
      }

    } catch (error) {
      console.error(error)
    }
  }

  async function fetchExistingBookstores() {
    try {
      const response = await fetch("http://localhost:3000/admin/existingBookstores", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setExistingBookstores(data);
      } else {
        console.log("There was an error fetching the exisiting bookstores:", response.status)
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
      value: bookTitlesList
    };
    const expectationsBookstore = {
      type: "string",
      presence: "not empty",
      length: 50,
      value: bookstoreNamesList
    };
    const expectationsPais = {
      type: "string",
      presence: "not empty",
      length: 50,
      value: countries
    };
    const expectationsInicial = {
      type: "number",
      presence: "not empty",
      range: "positive"
    }

    let errorInputs;
    let errorsBookstore;
    let errorsBook;
    const errorsPais = checkForErrors("Pais", country, expectationsPais, countryRef);
    const errorsInicial = checkForErrors("Cantidad inicial", inicial, expectationsInicial, inicialRef);
    if (clickedRow.book) {
      errorsBookstore = checkForErrors("Libreria", bookstore, expectationsBookstore, bookstoreRef);
      errorInputs = [errorsBookstore, errorsPais, errorsInicial];
    } else {
      errorsBook = checkForErrors("Libro", book, expectationsBook, bookRef);
      errorInputs = [errorsBook, errorsPais, errorsInicial];
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
      const response = await fetch('http://localhost:3000/admin/inventory', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          book: bookId,
          bookstore: bookstoreId,
          country: country,
          inicial: inicial
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo inventario.';
        closeModal(globalFilter, false, alertMessage, "error");
      } else {
        const alertMessage = `Un nuevo inventario ha sido creado.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo inventario</p>
        <p>{ clickedRow.book ? book : bookstore}</p>
      </div>
      <form className="global-form">
        { clickedRow.book ?
          null :
          <select onChange={(e) => dropDownChange(e, "Book")}
            className="select-global" ref={bookRef}>
            <option value="null">Selecciona libro</option>
            {existingBooks && existingBooks.map((book, index) => (
              <option key={index} value={book.title}>{book.title}</option>
            ))}
          </select>
        }
        { clickedRow.bookstore ?
          null :
          <select onChange={(e) => dropDownChange(e, "Bookstore")}
          className="select-global" ref={bookstoreRef}>
          <option value="null">Selecciona librería</option>
          {existingBookstores && existingBookstores.map((bookstore, index) => (
            <option key={index} value={bookstore.title}>{bookstore.name}</option>
          ))}
        </select>
        }
        <select onChange={(e) => dropDownChange(e, "Country")}
          className="select-global" ref={countryRef}>
          <option value="null">Selecciona pais</option>
          {countries && countries.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
        <input type="text" placeholder="Cantidad inicial de libros" className="global-input"
          ref={inicialRef} onChange={(e) => setInicial(parseInt(e.target.value))}></input>
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

export default AddingInventoryModal;
