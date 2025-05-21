import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteInventoryModal({ clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteInventory() {
    try {
      const response = await fetch(`${baseURL}/admin/inventory?inventory_id=${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El inventario ${clickedRow.book.title} de ${clickedRow.bookstore.name} ha sido eliminado con exito.`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
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
