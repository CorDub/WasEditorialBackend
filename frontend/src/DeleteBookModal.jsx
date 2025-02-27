import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

function DeleteBookModal({ row, closeDeleteModal, globalFilter }) {
  useCheckAdmin();
  const [hardDelete, setHardDelete] = useState(false);

  async function deleteBook() {
    try {
      const response = await fetch(`http://localhost:3000/admin/book?book_id=${row.id}&flag=${hardDelete}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        if (hardDelete === true) {
          const alertMessage = `El libro ${row.title} ha sido eliminado por siempre con exito.`;
          closeDeleteModal(globalFilter, true, alertMessage, "confirmation");
        } else {
          const alertMessage = `El libro ${row.title} ha sido eliminado con exito (recuperable).`;
          closeDeleteModal(globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = `No se pudó eliminar el libro ${row.title}.`;
        closeDeleteModal(globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar el libro
          ${row.title}?`}</p>
        </div>
        <div className='harddel-checkbox'>
          <p>Eliminar para siempre?</p>
          <input type='checkbox' onChange={() => setHardDelete(!hardDelete)}/>
        </div>
        {hardDelete &&
          <div className="harddel-confirm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
            <p>Eliminar para siempre borra todos los datos del libro en la base de datos, incluyendo a datos vinculados como sus ventas etc... No se podrán recuperar.</p>
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
          </div>
        }
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBook}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookModal;
