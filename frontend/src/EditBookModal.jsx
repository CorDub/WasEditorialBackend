import { useState, useEffect } from "react";
import useCheckUser from "./useCheckUser";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import Tooltip from "./Tooltip";
import AddingBookErrorList from "./AddingBookErrorList";

function EditBookModal({ row, closeEditModal, pageIndex, globalFilter }) {
  useCheckUser();

  const [title, setTitle] = useState(row.title);
  const [pasta, setPasta] = useState(row.pasta);
  const [price, setPrice] = useState(row.price);
  const [isbn, setIsbn] = useState(row.isbn);
  const [authors, setAuthors] = useState(row.users);
  const [existingAuthors, setExistingAuthors] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [errorList, setErrorList] = useState([]);

  async function fetchUsers() {
      try {
        const response = await fetch('http://localhost:3000/admin/users', {
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

  function authorsChange(index, event) {
    const authorsNew = [...authors];
    authorsNew[index] = parseInt(event.target.value);
    setAuthors(authorsNew);
  }

  function addOtherAuthor() {
    setAuthors([...authors, 0]);
  }

  function removeOtherAuthor(indexToRemove) {
    setAuthors(authors.filter((_, index)=> index !== indexToRemove));
  }

  async function sendToServer() {
    // const authors_ids = [];
    // authors.map((author) => {
    //   authors_ids.push(author)
    // })

    try {
      const response = await fetch('http://localhost:3000/admin/book', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          title: title,
          pasta: pasta,
          price: price,
          isbn: isbn,
          authors: authors,
        })
      });

      if (response.ok === true) {
        const alertMessage = `Se actualizó ${title} con exito`;
        closeEditModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó actualizar ${title}`;
        closeEditModal(pageIndex, globalFilter, false, alertMessage, "error");
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

  function addErrorClass(element) {
    if (!element.classList.contains("error")) {
      element.classList.add("error");
    };
  }

  function checkForErrors() {
    let newErrorList =[];

    const inputTitle = document.getElementById('adding-book-title');
    const inputPasta = document.getElementById('pasta-select');
    const inputPrice = document.getElementById('adding-book-price');
    const inputIsbn = document.getElementById('adding-book-isbn');
    const inputAuthors = [];
    authors.map((author, index) => {
      inputAuthors.push(document.getElementById(`author-select-${index}`));
    });

    const inputsList = [inputTitle, inputPasta, inputPrice,
      inputIsbn, inputAuthors];

    inputsList.forEach((input) => {
      if (input !== inputAuthors) {
        if (input.classList.contains("error")) {
          input.classList.remove("error");
        }
      }
    })
    inputAuthors.forEach((input) => {
      if (input.classList.contains("error")) {
        input.classList.remove("error");
      }
    })

    if (title === '') {
      newErrorList.push(11);
      addErrorClass(inputTitle);
    };

    if (title.length > 200) {
      newErrorList.push(12);
      addErrorClass(inputTitle);
    };

    if (pasta === null) {
      newErrorList.push(21);
      addErrorClass(inputPasta);
    };

    if (pasta !== "Dura" && pasta !== "Blanda") {
      newErrorList.push(22);
      addErrorClass(inputPasta);
    };

    if (isNaN(parseFloat(price))) {
      newErrorList.push(31);
      addErrorClass(inputPrice);
    };

    if (parseFloat(price) < 0) {
      newErrorList.push(32);
      addErrorClass(inputPrice);
    };

    if (price === null) {
      newErrorList.push(33);
      addErrorClass(inputPrice);
    }

    // if (parseInt(isbn).isNaN()) {
    //   newErrorList.push(33);
    //   addErrorClass(inputIsbn);
    // };

    authors.map((author, index) => {
      if (author === null) {
        newErrorList.push(41);
        addErrorClass(inputAuthors[index]);
      };

      let authorsIds = []
      existingAuthors.map((author) => {
        authorsIds.push(author.id);
      })
      if (!authorsIds.includes(author)) {
        newErrorList.push(42);
        addErrorClass(inputAuthors[index]);
      };
    })

    setErrorList(newErrorList);
    return newErrorList;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }
    sendToServer();
  }

  function dropDownChange(e, input_name, input_index) {
    console.log(e);
    console.log(input_name);
    console.log(input_index);

    const inputs = {
      "Pasta": {
        "function": setPasta,
        "element": document.getElementById("pasta-select")
      },
      "Autor": {
        "function": authorsChange,
        "element": document.getElementById(`author-select-${input_index}`)
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

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <div className="form-title">
          <p>Editar libro</p>
        </div>
        <form className="global-form" onSubmit={handleSubmit}>
        <input type='text' value={title}
          className="global-input" id="adding-book-title"
          onChange={(e) => setTitle(e.target.value)}></input>
        <select onChange={(e) =>dropDownChange(e, "Pasta")}
          className="select-global" id="pasta-select">
          <option value={pasta}>{pasta}</option>
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' value={price}
          className="global-input" id="adding-book-price"
          onChange={(e) => setPrice(e.target.value)}></input>
        <input type='text' value={isbn === "" ? "ISBN" : isbn}
          className="global-input" id="adding-book-isbn"
          onChange={(e) => setIsbn(e.target.value)}></input>
        {authors.map((author, index) => (
          <div key={index} className="book-edit-author-dropdown">
            <select onChange={(e) =>dropDownChange(e, "Autor", index)}
              className="select-global" id={`author-select-${index}`}>
              <option key={index}>{authors[index].first_name} {authors[index].last_name}</option>
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
              <Tooltip message={tooltipMessage} x={x} y={y}/>
              <FontAwesomeIcon icon={faCirclePlus} onClick={addOtherAuthor}
                id={`plus-icon-${index}`}
                onMouseEnter={() => toggleTooltip(
                  "Añadir autor a la lista de autores del libro",
                  `plus-icon-${index}`)}
                onMouseLeave={() => toggleTooltip(
                  "Añadir autor a la lista de autores del libro",
                  `plus-icon-${index}`)}
                className="button-icon"/>
              {authors.length > 1 &&
                <>
                  <Tooltip
                    message={tooltipMessage}
                    x={x}
                    y={y}/>
                  <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeOtherAuthor(index)}
                    id={`cross-icon-${index}`}
                    onMouseEnter={() => toggleTooltip(
                      "Eliminar el autor de la lista de autores del libro",
                      `cross-icon-${index}`)}
                    onMouseLeave={() => toggleTooltip(
                      "Eliminar el autor de la lista de autores del libro",
                      `cross-icon-${index}`)}
                    className="button-icon"/>
                </>}
            </div>
          </div>
        ))}
        <AddingBookErrorList errorList={errorList} setErrorList={setErrorList}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeEditModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir nuevo libro</button>
        </div>
        </form>
      </div>
    </div>
  )
}

export default EditBookModal;
