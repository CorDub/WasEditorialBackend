import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

function DeleteInventoryModal({ clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const [hardDelete, setHardDelete] = useState(false);

  async function deleteInventory() {
    try {
      const response = await fetch(`http://localhost:3000/admin/inventory?inventory_id=${clickedRow.id}&flag=${hardDelete}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        if (hardDelete === true) {
          const alertMessage = `El inventario ${clickedRow.book.title} de ${clickedRow.bookstore.name} ha sido eliminado por siempre con exito.`;
          closeModal(globalFilter, true, alertMessage, "confirmation");
        } else {
          const alertMessage = `El inventario ${clickedRow.book.title} de ${clickedRow.bookstore.name} ha sido eliminado con exito. (recuperable)`;
          closeModal(globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = `No se pudó eliminar el inventario ${clickedRow.book.title} de ${clickedRow.bookstore.name}.`;
        closeModal(globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting inventory', error)
    }
  }

  return(
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar el inventario
        ${clickedRow.book.title} de ${clickedRow.bookstore.name}?`}</p>
      </div>
      <div className='harddel-checkbox'>
          <p>Eliminar para siempre?</p>
          <input type='checkbox' onChange={() => setHardDelete(!hardDelete)}/>
        </div>
        {hardDelete &&
          <div className="harddel-confirm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
            <p>Eliminar para siempre borra todos los datos del inventario en la base de datos. No se podrán recuperar.</p>
            <FontAwesomeIcon icon={faTriangleExclamation} className="harddel-icon"/>
          </div>
        }
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteInventory}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteInventoryModal;
