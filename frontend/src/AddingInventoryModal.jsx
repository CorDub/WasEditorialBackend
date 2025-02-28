import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState, useRef, useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingInventoryModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckSuperAdmin();
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingBookstores, setExistingBookstores] = useState([]);
  const [errors, setErrors] = useState([]);

  console.log(existingBooks);
  console.log(existingBookstores);

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

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo inventario</p>
      </div>
      <form className="global-form">



        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' className="blue-button">Añadir</button>
        </div>
      </form>
    </div>
  )
}

export default AddingInventoryModal;
