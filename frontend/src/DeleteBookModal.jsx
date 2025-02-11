import useCheckUser from "./useCheckUser";

function DeleteBookModal({ row, closeDeleteModal }) {
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
        closeDeleteModal;
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeDeleteModal}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar el libro
          ${row.title}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={closeDeleteModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBook}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookModal;
