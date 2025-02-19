import { useState } from 'react';
import useCheckUser from './useCheckUser';
import AddingCategoryError from './AddingCategoryError';

function AddingCategoryModal({ closeAddingModal, pageIndex, globalFilter }) {
  useCheckUser();

  const [tipo, setTipo] = useState(null);
  const [regalias, setRegalias] = useState(null);
  const [gestionTiendas, setGestionTiendas] = useState(null);
  const [gestionMinima, setGestionMinima] = useState(null);
  const [errorList, setErrorList] = useState([]);

  async function sendToServer() {
    try {
      const response = await fetch('http://localhost:3000/admin/category', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          tipo: tipo,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear una nueva categoria.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Una nueva categoria ${data.type} ha sido creado.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  function addErrorClass(element) {
    if (!element.classList.contains("error")) {
      element.classList.add("error");
    };
  }

  function checkForErrors() {
    let newErrorList = [];
    const inputTipo = document.getElementById("adding-bookstore-type");
    const inputRegalias = document.getElementById("adding-bookstore-regalias");
    const inputGestionTiendas = document.getElementById("adding-bookstore-gestionTiendas");
    const inputGestionMinima = document.getElementById("adding-bookstore-gestionMinima");
    let inputList = [inputTipo, inputRegalias, inputGestionTiendas, inputGestionMinima];

    inputList.forEach((input) => {
      if (input.classList.contains("error")) {
        input.classList.remove("error");
      }
    });

    if (tipo === "") {
      newErrorList.push(11);
      addErrorClass(inputTipo);
    } else {
      if (tipo.length > 30) {
        newErrorList.push(12);
        addErrorClass(inputTipo)
      }
    };

    if (isNaN(parseInt(regalias))) {
      newErrorList.push(21);
      addErrorClass(inputRegalias);
    } else {
      
    }

    setErrorList(newErrorList);
    return newErrorList;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }
    sendToServer();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <div className="form-title">
        <p>Nueva categoría</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form">
        <input type='text' placeholder="Tipo"
          className="global-input" id="adding-category-type"
          onChange={(e) => setTipo(e.target.value)}></input>
        <input type='text' placeholder="% Regalias de venta"
          className="global-input" id="adding-category-regalias"
          onChange={(e) => setRegalias(e.target.value)}></input>
        <input type='text' placeholder="% Gestion tiendas"
          className="global-input" id="adding-category-gestionTiendas"
          onChange={(e) => setGestionTiendas(e.target.value)}></input>
        <input type='text' placeholder="Gestion minima"
          className="global-input" id="adding-category-gestionMinima"
          onChange={(e) => setGestionMinima(e.target.value)}></input>
        <AddingCategoryError errorList={errorList} setErrorList={setErrorList}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeAddingModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='submit' className="blue-button">Añadir</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddingCategoryModal;
