import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

function DeleteAdminModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckSuperAdmin();
  const [hardDelete, setHardDelete] = useState(false);

  async function deleteAdmin() {
    try {
      const response = await fetch(`http://localhost:3000/superadmin/admin?user_id=${clickedRow.id}&flag=${hardDelete}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        if (hardDelete === true) {
          const alertMessage = `El admin ${clickedRow.first_name} ${clickedRow.last_name} ha sido eliminado por siempre con exito.`;
          closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
        } else {
          const alertMessage = `El admin ${clickedRow.first_name} ${clickedRow.last_name} ha sido eliminado con exito. (recuperable)`;
          closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = `No se pudó eliminar el admin ${clickedRow.first_name} ${clickedRow.last_name}.`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar el admin
        ${clickedRow.first_name} ${clickedRow.last_name}?`}</p>
      </div>
      <div className='harddel-checkbox'>
          <p>Eliminar para siempre?</p>
          <input type='checkbox' onChange={() => setHardDelete(!hardDelete)}/>
        </div>
        {hardDelete &&
          <div className="harddel-confirm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
            <p>Eliminar para siempre borra todos los datos del admin en la base de datos. No se podrán recuperar.</p>
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
          </div>
        }
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteAdmin}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteAdminModal;
