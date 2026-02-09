import { useEffect, useState, useRef } from 'react';
import useCheckAdmin from './customHooks/useCheckAdmin';
import "./AddingBookModal.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import Tooltip from "./Tooltip";
import AddingBookErrorList from "./AddingBookErrorList";
import ErrorsList from "./ErrorsList";
import checkForErrors from './customHooks/checkForErrors';

function AddingBookModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [title, setTitle] = useState('');
  const [pasta, setPasta] = useState('');
  const [price, setPrice] = useState(null);
  const [isbn, setIsbn] = useState('');
  const [quantity, setQuantity] = useState(null);
  const [authors, setAuthors] = useState([null]);
  const [existingAuthors, setExistingAuthors] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  // const [errorList, setErrorList] = useState([]);
  const [errors, setErrors] = useState([]);
  const [category, setCategory] = useState(null);
  const [existingCategories, setExistingCategories] = useState([]);
  const titleRef = useRef()
  const pastaRef = useRef()
  const priceRef = useRef()
  const categoryRef = useRef()
  const isbnRef = useRef()
  const quantityRef = useRef()

  async function fetchUsers() {
    try {
      const response = await fetch(`${baseURL}/api/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setExistingAuthors(data);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [])

  useEffect(() => {
    async function fetchExistingCategories() {
      try {
        const response = await fetch(`${baseURL}/api/admin/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          let categoryNumbers = [];
          for (const entry of data) {
            categoryNumbers.push(entry.number)
          }
          setExistingCategories(categoryNumbers);
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchExistingCategories();
  }, [])

  async function sendToServer(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${baseURL}/api/admin/book`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          title: title,
          pasta: pasta,
          price: price,
          isbn: isbn,
          quantity: parseInt(quantity),
          category: category,
          authors: authors,
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        // console.log(error.message === "Este ISBN ya existe");
        if (error.message === "Este ISBN ya existe") {
          closeModal(pageIndex, globalFilter, false, error.message, "error")
          return;
        }

        if (error.message === "Un libro con el mismo título y autor ya existe.") {
          closeModal(pageIndex, globalFilter, false, error.message, "error")
          return;
        }

        const alertMessage= 'No se pudó crear un nuveo libro.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un nuevo libro ${data.title} ha sido creado.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function authorsChange(index, event) {
    const authorsNew = [...authors];
    if (event.target.value === "null") {
      authorsNew[index] = null;
    } else {
      authorsNew[index] = parseInt(event.target.value);
    }
    setAuthors(authorsNew);
  }

  function addOtherAuthor() {
    setAuthors([...authors, 0]);
  }

  function removeOtherAuthor(indexToRemove) {
    setAuthors(authors.filter((_, index)=> index !== indexToRemove));
    setX(null);
    setY(null);
    setTooltipMessage("");
  }

  function dropDownChange(e, input_name, input_index) {

    const inputs = {
      "Pasta": {
        "function": setPasta,
        "element": document.getElementById("pasta-select")
      },
      "Autor": {
        "function": authorsChange,
        "element": document.getElementById(`author-select-${input_index}`)
      },
      "Category": {
        "function": setCategory,
        "element": document.getElementById("category-select")
      }
    }

    if (input_index !== undefined) {
      inputs[input_name]["function"](input_index, e);
      if (e.target.value === "null") {
        if (inputs[input_name]["element"].classList.contains("selected") === true) {
          inputs[input_name]["element"].classList.remove("selected")
        };
        return;
      } else {
        // inputs[input_name]["function"](input_index, e);
        if (inputs[input_name]["element"].classList.contains("selected") === false) {
          inputs[input_name]["element"].classList.add("selected")
        };
        return;
      }
    };

    if (e.target.value === "null") {
      inputs[input_name]["function"](null);
      if (inputs[input_name]["element"].classList.contains("selected") === true) {
        inputs[input_name]["element"].classList.remove("selected")
      };
    } else {
      inputs[input_name]["function"](e.target.value);
      if (inputs[input_name]["element"].classList.contains("selected") === false) {
        inputs[input_name]["element"].classList.add("selected")
      };
    };
  }

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

  // function addErrorClass(element) {
  //   if (!element.classList.contains("error-inputs")) {
  //     element.classList.add("error-inputs");
  //   };
  // }

  // function checkForErrors(serverError) {
  //   let newErrorList =[];

  //   const inputTitle = document.getElementById('adding-book-title');
  //   const inputPasta = document.getElementById('pasta-select');
  //   const inputPrice = document.getElementById('adding-book-price');
  //   const inputIsbn = document.getElementById('adding-book-isbn');
  //   const inputQuantity = document.getElementById('adding-book-quantity');
  //   const inputCategory = document.getElementById('category-select');
  //   const inputAuthors = [];
  //   authors.map((author, index) => {
  //     inputAuthors.push(document.getElementById(`author-select-${index}`));
  //   });

  //   const inputsList = [inputTitle, inputPasta, inputPrice,
  //     inputIsbn, inputQuantity, inputAuthors, inputCategory];

  //   inputsList.forEach((input) => {
  //     if (input !== inputAuthors) {
  //       if (input.classList.contains("error-inputs")) {
  //         input.classList.remove("error-inputs");
  //       }
  //     }
  //   })
  //   inputAuthors.forEach((input) => {
  //     if (input.classList.contains("error-inputs")) {
  //       input.classList.remove("error-inputs");
  //     }
  //   })

  //   if (title === '') {
  //     newErrorList.push(11);
  //     addErrorClass(inputTitle);
  //   };

  //   if (title.length > 200) {
  //     newErrorList.push(12);
  //     addErrorClass(inputTitle);
  //   };

  //   if (serverError === 13) {
  //     newErrorList.push(13);
  //     addErrorClass(inputTitle)
  //   }

  //   if (pasta === null) {
  //     newErrorList.push(21);
  //     addErrorClass(inputPasta);
  //   };

  //   if (pasta !== "Dura" && pasta !== "Blanda") {
  //     newErrorList.push(22);
  //     addErrorClass(inputPasta);
  //   };

  //   if (isNaN(parseFloat(price))) {
  //     newErrorList.push(31);
  //     addErrorClass(inputPrice);
  //   };

  //   if (parseFloat(price) < 0) {
  //     newErrorList.push(32);
  //     addErrorClass(inputPrice);
  //   };

  //   if (price === null) {
  //     newErrorList.push(33);
  //     addErrorClass(inputPrice);
  //   }

  //   // if (isNaN(parseInt(isbn)) && isbn !== "") {
  //   //   newErrorList.push(41);
  //   //   addErrorClass(inputIsbn);
  //   // };

  //   if (serverError === 42) {
  //     newErrorList.push(42);
  //     addErrorClass(inputIsbn);
  //   };

  //   if (isbn !== "") {
  //     const validISBNRegex = /^(?:(?:\d{9}[\dX])|(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dX])|(?:(?:978|979)\d{10})|(?:(?:978|979)-\d{1,5}-\d{1,7}-\d{1,7}-\d))$/;
  //     if (!validISBNRegex.test(isbn)) {
  //       newErrorList.push(43);
  //       addErrorClass(inputIsbn);
  //     }
  //   }

  //   if (isNaN(parseInt(quantity))) {
  //     newErrorList.push(61);
  //     addErrorClass(inputQuantity);
  //   };

  //   if (parseInt(quantity) < 0) {
  //     newErrorList.push(62);
  //     addErrorClass(inputQuantity);
  //   };

  //   if (isNaN(parseInt(category))) {
  //     newErrorList.push(71);
  //     addErrorClass(inputCategory);
  //   }

  //   authors.map((author, index) => {
  //     if (author === null) {
  //       newErrorList.push(51);
  //       addErrorClass(inputAuthors[index]);
  //     };

  //     let authorsIds = []
  //     existingAuthors.map((author) => {
  //       authorsIds.push(author.id);
  //     })
  //     if (!authorsIds.includes(author)) {
  //       newErrorList.push(52);
  //       addErrorClass(inputAuthors[index]);
  //     };

  //     const authorsSet = new Set(authors);
  //     if (authorsSet.size !== authors.length) {
  //       if (!newErrorList.includes(53)) {
  //         newErrorList.push(53);
  //       }
  //       addErrorClass(inputAuthors[index]);
  //     }
  //   })

  //   setErrorList(newErrorList);
  //   return newErrorList;
  // }

  function checkInputs() {
    let errorsList = []
    const titleExpectations = {
      presence: "not empty",
      type: "string",
      length: 255
    }
    const pastaExpectations =  {
      presence: "not empty",
      type: "string",
      value: ["Blanda", "Dura"]
    }
    const priceExpectations = {
      presence: "not empty",
      type: "number",
      range: "positive"
    }
    const categoryExpectations = {
      presence: "not empty",
      type: "number",
      value: existingCategories
    }
    const isbnExpectations = {
      validity: "isbn valid",
    }
    const quantityExpectations = {
      presence: "not empty",
      type: "number",
      range: "positive"
    }
    const authorExpectations = {
      presence: "not empty",
      value: existingAuthors
    }

    const errorsTitle = checkForErrors("Título", title, titleExpectations, titleRef, "o");
    const errorsPasta = checkForErrors("Pasta", pasta, pastaExpectations, pastaRef, "a");
    const errorsPrice = checkForErrors("Precio", price, priceExpectations, priceRef, "o");
    const errorsCategory = checkForErrors("Categoría", parseInt(category), categoryExpectations, categoryRef, "a");
    const errorsISBN = isbn !== "" ? checkForErrors("ISBN", isbn, isbnExpectations, isbnRef, "o") : [];
    const errorsQuantity = checkForErrors("Cantidad", quantity, quantityExpectations, quantityRef, "a");

    let errorInputs = [
      errorsTitle,
      errorsPasta,
      errorsPrice,
      errorsCategory,
      errorsISBN,
      errorsQuantity
    ]

    for (const i in authors) {
      const authorId = document.getElementById(`author-select-${i}`)
      const errorAuthor = checkForErrors("Autor", authors[i], authorExpectations, authorId, "o");
      if (errorAuthor.length > 1) {
        errorInputs.push(errorAuthor);
      }
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

    const errorList = checkInputs();
    if (errorList.length > 0) {
      return;
    }
    sendToServer(e);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo libro</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Titulo*"
          className="global-input" id="adding-book-title"
          ref={titleRef}
          onChange={(e) => setTitle(e.target.value)}></input>
        <select onChange={(e) =>dropDownChange(e, "Pasta")} className="select-global"
          ref={pastaRef}
          id="pasta-select">
          <option value="null">Selecciona pasta*</option>
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' placeholder="Precio*"
          ref={priceRef}
          className="global-input" id="adding-book-price"
          onChange={(e) => setPrice(e.target.value)}></input>
        <select onChange={(e) => dropDownChange(e, "Category")}
          className="select-global"
          id="category-select"
          ref={categoryRef}>
          <option value="null">Selecciona categoría</option>
          {existingCategories && existingCategories.map((category, index) => (
            <option value={category} key={index}>{category}</option>
          )) }
        </select>
        <input type='text' placeholder="ISBN"
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          className="global-input" id="adding-book-isbn"
          onChange={(e) => setIsbn(e.target.value)}
          ref={isbnRef}></input>
        <input
          type='text'
          placeholder='Cantidad inicial imprimida*'
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
          className="global-input"
          id="adding-book-quantity"
          ref={quantityRef}
          onChange={(e) => setQuantity(e.target.value)}></input>
        {authors.length > 1 && (
          <div className="autor-principal">El autor principal es el primero en la lista</div>
        )}
        {authors.map((author, index) => (
          <div key={index} className="book-edit-author-dropdown">
            <select onChange={(e) =>dropDownChange(e, "Autor", index)} className="select-global"
              id={`author-select-${index}`}>
              <option key={index} value="null">Selecciona un autor*</option>
              {existingAuthors && existingAuthors.map((author, index) => {
                return (
                  <>
                    <option key={index} value={`${author.id}`}>
                      {author.first_name} {author.last_name}</option>
                  </>
                )
              })}
            </select>
            <div className="additional-authors-buttons">
              {/* <Tooltip message={tooltipMessage} x={x} y={y}/> */}
              <FontAwesomeIcon icon={faCirclePlus} onClick={addOtherAuthor}
                id={`plus-icon-${index}`}
                onMouseEnter={() => toggleTooltip(
                  "Añadir autor",
                  `plus-icon-${index}`)}
                onMouseLeave={() => toggleTooltip(
                  "Añadir autor",
                  `plus-icon-${index}`)}
                className="button-icon"/>
              {authors.length > 1 &&
                <>
                  {/* <Tooltip
                    message={tooltipMessage}
                    x={x}
                    y={y}/> */}
                  <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeOtherAuthor(index)}
                    id={`cross-icon-${index}`}
                    onMouseEnter={() => toggleTooltip(
                      "Eliminar el autor",
                      `cross-icon-${index}`)}
                    onMouseLeave={() => toggleTooltip(
                      "Eliminar el autor",
                      `cross-icon-${index}`)}
                    className="button-icon"/>
                </>}
            </div>
          </div>
        ))}
        {/* <AddingBookErrorList errorList={errorList} setErrorList={setErrorList}/> */}
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir nuevo libro</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingBookModal;
