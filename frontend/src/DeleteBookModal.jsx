import useCheckUser from "./customHooks/useCheckUser";

function DeleteBookModal({ row, closeDeleteModal, pageIndex, globalFilter }) {
  useCheckUser();

  async function deleteBook() {
    try {
      const response = await fetch(`http://localhost:3000/admin/book?book_id=${row.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El libro ${row.title} ha sido eliminado con exito.`;
        closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar el libro ${row.title}.`;
        closeDeleteModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar el libro
          ${row.title}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBook}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookModal;
