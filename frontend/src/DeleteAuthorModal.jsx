import "./DeleteAuthorModal.scss"
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

function DeleteAuthorModal({ row, closeDeleteModal, globalFilter }) {
  useCheckAdmin();
  const [hardDelete, setHardDelete] = useState(false);

  async function deleteAuthor(e) {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/admin/user?user_id=${row.id}&flag=${hardDelete}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        if (hardDelete === true) {
          const alertMessage = `El autor ${row.first_name} ${row.last_name} ha sido eliminado para siempre.`;
          closeDeleteModal(globalFilter, true, alertMessage, "confirmation");
        } else {
          const alertMessage = `El autor ${row.first_name} ${row.last_name} ha sido eliminado.`;
          closeDeleteModal(globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = `No se pudo eliminar el autor ${row.first_name} ${row.last_name}`;
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
          <p>{`¿Está seguro que quiere eliminar el autor
          ${row.first_name} ${row.last_name}?`}</p>
        </div>
        <div className='harddel-checkbox'>
          <p>Eliminar para siempre?</p>
          <input type='checkbox' onChange={() => setHardDelete(!hardDelete)}/>
        </div>
        {hardDelete &&
          <div className="harddel-confirm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
            <p>Eliminar para siempre borra todos los datos del autor en la base de datos, incluyendo a datos vinculados como los libros del autor, sus ventas etc... No se podrán recuperar.</p>
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
          </div>
        }
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteAuthor}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAuthorModal;
