import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteBookstoreModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();

  async function deleteBookstore() {
    const baseURL = import.meta.env.VITE_API_URL || '';
    try {
      const response = await fetch(`${baseURL}/api/admin/bookstore/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `La librería ${clickedRow.name} ha sido eliminada con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");

      } else {
        const alertMessage = `No se pudó eliminar la librería ${clickedRow.name}`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
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
          ${clickedRow.name}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBookstore}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookstoreModal;
