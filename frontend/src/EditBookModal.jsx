import { useState, useEffect, useRef } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import Tooltip from "./Tooltip";
import ErrorsList from "./ErrorsList";
import checkForErrors from "./customHooks/checkForErrors";

function EditBookModal({ clickedRow, closeModal, pageIndex, globalFilter, userFontSize }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [title, setTitle] = useState(clickedRow.title);
  const [pasta, setPasta] = useState(clickedRow.pasta || '');
  const [isbn, setIsbn] = useState(clickedRow.isbn);
  const [authors, setAuthors] = useState(clickedRow.users);
  const [existingAuthors, setExistingAuthors] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  // const [errorList, setErrorList] = useState([]);
  const [pastaDisplay, setPastaDisplay] = useState([]);
  const [category, setCategory] = useState(clickedRow.categoryId);
  const [existingCategories, setExistingCategories] = useState([]);
  const [existingCategoryNumbers, setExistingCategoryNumbers] = useState([]);
  const [errors, setErrors] = useState([]);
  const titleRef = useRef()
  const pastaRef = useRef()
  const categoryRef = useRef()
  const isbnRef = useRef()

  useEffect(() => {
    let possiblePasta = ["Blanda", "Dura"]
    for (let i = 0; i < possiblePasta.length; i++) {
      if (possiblePasta[i] === clickedRow.pasta) {
        possiblePasta.splice(i, 1);
      } 
    }
    possiblePasta.splice(0, 0, clickedRow.pasta);
    setPastaDisplay(possiblePasta);
  }, [clickedRow.pasta])

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
          const data = await response.json()
          let categoryNumbers = [];
          for (const entry of data) {
            categoryNumbers.push(entry.number)
          }
          setExistingCategories(data);
          setExistingCategoryNumbers(categoryNumbers);
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchExistingCategories();
  }, [])

  function authorsChange(index, event) {
    const authorsNew = [...authors];
    authorsNew[index] = JSON.parse(event.target.value);
    setAuthors(authorsNew);
  }

  function addOtherAuthor() {
    setAuthors([...authors, 0]);
  }

  function removeOtherAuthor(indexToRemove) {
    setAuthors(authors.filter((_, index)=> index !== indexToRemove));
  }

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/book/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          title: title,
          pasta: pasta,
          isbn: isbn,
          authors: authors,
          category: category
        })
      });

      if (response.ok === true) {
        const alertMessage = `Se actualizó "${title}" con exito`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const error = await response.json();
        if (error.message === "Este ISBN ya existe") {
          closeModal(pageIndex, globalFilter, false, error.message, "error")
          return;
        }

        if (error.message === "Un libro con el mismo título ya existe.") {
          closeModal(pageIndex, globalFilter, false, error.message, "error")
          return;
        }
        const alertMessage = `No se pudó actualizar "${title}"`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
    }
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
    const categoryExpectations = {
      presence: "not empty",
      type: "number",
      value: existingCategoryNumbers
    }
    const isbnExpectations = {
      validity: "isbn valid",
    }
    const authorExpectations = {
      presence: "not empty",
      value: existingAuthors
    }

    const errorsTitle = checkForErrors("Título", title, titleExpectations, titleRef, "o");
    const errorsPasta = checkForErrors("Pasta", pasta, pastaExpectations, pastaRef, "a");
    const errorsCategory = checkForErrors("Categoría", parseInt(category), categoryExpectations, categoryRef, "a");
    const errorsISBN = isbn !== null ? checkForErrors("ISBN", isbn, isbnExpectations, isbnRef, "o") : [];

    let errorInputs = [
      errorsTitle,
      errorsPasta,
      errorsCategory,
      errorsISBN,
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

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <div className="form-title">
          <p>Editar libro</p>
          <p className="form-subtitle">{clickedRow.title}</p>
        </div>
        <div className="campos-obligatorios">
          <p>*Campos obligatorios</p>
        </div>
        <form className="global-form" onSubmit={handleSubmit}>
          <div className="modal-form-line">
            <label className="modal-form-label">Título *</label>
            <input type='text' value={title}
              className="global-input" id="adding-book-title"
              ref={titleRef}
              onChange={(e) => setTitle(e.target.value)}></input>
            </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Pasta *</label>
            <select onChange={(e) =>dropDownChange(e, "Pasta")}
              className="select-global" id="pasta-select"
              ref={pastaRef}>
              {pastaDisplay.map((pasta, index) => (
                <option key={index} value={pasta}>{pasta}</option>
              ))}
            </select>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Categoría</label>
            <select onChange={(e) => dropDownChange(e, "Category")}
              value={category.id}
              className="select-global"
              id="category-select"
              ref={categoryRef}>
              {existingCategories && existingCategories.map((category, index) => (
                <option value={category.id} key={index}>{category.number}</option>
              )) }
            </select>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">ISBN</label>
            <input type='text' value={isbn} placeholder="ISBN"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
              className="global-input" id="adding-book-isbn"
              ref={isbnRef}
              onChange={(e) => setIsbn(e.target.value)}></input>
          </div>
          <div className="modal-form-line">
            <label className="modal-form-label">Autores *</label>
            {authors.map((author, index) => (
              <div key={index} className="book-edit-author-dropdown">
                <select onChange={(e) => dropDownChange(e, "Autor", index)}
                  className="select-global" id={`author-select-${index}`}>
                  <option key={index}>{authors[index].first_name} {authors[index].last_name}</option>
                  {existingAuthors && existingAuthors.map((author, index) => {
                    return (
                      <>
                        <option key={index} value={JSON.stringify(author)}>
                          {author.first_name} {author.last_name}</option>
                      </>
                    )
                  })}
                </select>
                <div className="additional-authors-buttons">
                  <Tooltip message={tooltipMessage} x={x} y={y} userFontSize={userFontSize}/>
                  <FontAwesomeIcon icon={faCirclePlus} onClick={addOtherAuthor}
                    id={`plus-icon-${index}`}
                    onMouseEnter={() => toggleTooltip(
                      "Añadir autor a la lista de autores",
                      `plus-icon-${index}`)}
                    onMouseLeave={() => toggleTooltip(
                      "Añadir autor a la lista de autores",
                      `plus-icon-${index}`)}
                    className="button-icon"/>
                  {authors.length > 1 &&
                    <>
                      <Tooltip
                        message={tooltipMessage}
                        x={x}
                        y={y}
                        userFontSize={userFontSize}/>
                      <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeOtherAuthor(index)}
                        id={`cross-icon-${index}`}
                        onMouseEnter={() => toggleTooltip(
                          "Eliminar el autor de la lista de autores",
                          `cross-icon-${index}`)}
                        onMouseLeave={() => toggleTooltip(
                          "Eliminar el autor de la lista de autores",
                          `cross-icon-${index}`)}
                        className="button-icon"/>
                    </>}
                </div>
              </div>
            ))}
          </div>
        {/* <AddingBookErrorList errorList={errorList} setErrorList={setErrorList}/> */}
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Confirmar</button>
        </div>
        </form>
      </div>
    </div>
  )
}

export default EditBookModal;
