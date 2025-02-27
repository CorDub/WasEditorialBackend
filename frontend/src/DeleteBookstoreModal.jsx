import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

function DeleteBookstoreModal({ row, closeDeleteModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const [hardDelete, setHardDelete] = useState(false);

  async function deleteBookstore() {
    try {
      const response = await fetch(`http://localhost:3000/admin/bookstore?bookstore_id=${row.id}&flag=${hardDelete}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        if (hardDelete === true) {
          const alertMessage = `La librería ${row.name} ha sido eliminado por siempre con exito.`;
          closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
        } else {
          const alertMessage = `La librería ${row.name} ha sido eliminada con exito (recuperable).`;
          closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = `No se pudó eliminar la librería ${row.name}`;
        closeDeleteModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting bookstore', error)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar la librería
          ${row.name}?`}</p>
        </div>
        <div className='harddel-checkbox'>
          <p>Eliminar para siempre?</p>
          <input type='checkbox' onChange={() => setHardDelete(!hardDelete)}/>
        </div>
        {hardDelete &&
          <div className="harddel-confirm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
            <p>Eliminar para siempre borra todos los datos de la libreria en la base de datos, incluyendo a datos vinculados como ventas y inventorias etc... No se podrán recuperar.</p>
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
          </div>
        }
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBookstore}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookstoreModal;
