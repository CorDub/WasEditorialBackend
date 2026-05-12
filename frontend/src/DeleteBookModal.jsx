import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteBookModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteBook() {
    try {
      const response = await fetch(`${baseURL}/api/admin/books/book/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El libro ${clickedRow.title} ha sido eliminado con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar el libro ${clickedRow.title}.`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
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
          ${clickedRow.title}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBook}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookModal;
