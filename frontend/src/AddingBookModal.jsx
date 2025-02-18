import { useEffect, useState, useRef } from 'react';
import useCheckUser from './useCheckUser';
import "./AddingBookModal.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import Tooltip from "./Tooltip";

function AddingBookModal({ closeAddingModal }) {
  useCheckUser();

  const [title, setTitle] = useState(null);
  const [pasta, setPasta] = useState(null);
  const [price, setPrice] = useState(null);
  const [isbn, setIsbn] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [existingAuthors, setExistingAuthors] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);

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

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/admin/book', {
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
          authors: authors,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear un nuveo libro.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Un nuevo libro ${data.title} ha sido creado.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  function authorsChange(index, event) {
    const authorsNew = [...authors];
    authorsNew[index] = parseInt(event.target.value);
    setAuthors(authorsNew);
  }

  function addOtherAuthor() {
    setAuthors([...authors, 0]);
  }

  useEffect(() => {
    addOtherAuthor();
  }, []);

  function removeOtherAuthor(indexToRemove) {
    setAuthors(authors.filter((_, index)=> index !== indexToRemove));
    setX(null);
    setY(null);
    setTooltipMessage("");
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

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo libro</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Titulo"
          className="global-input"
          onChange={(e) => setTitle(e.target.value)}></input>
        <select onChange={(e) =>setPasta(e.target.value)} className="global-input">
          <option value="null">Selecciona pasta</option>
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' placeholder="Precio"
          className="global-input"
          onChange={(e) => setPrice(e.target.value)}></input>
        <input type='text' placeholder="ISBN"
          className="global-input"
          onChange={(e) => setIsbn(e.target.value)}></input>
        {authors.map((author, index) => (
          <div key={index} className="book-edit-author-dropdown">
            <select onChange={(event) => authorsChange(index, event)} className="global-input">
              <option key={index}>Selecciona un autor</option>
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
        <div className="form-actions">
          <button type='submit' className="blue-button">Añadir nuevo libro</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingBookModal;
