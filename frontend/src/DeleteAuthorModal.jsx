import "./DeleteAuthorModal.scss"
import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteAuthorModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteAuthor(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${baseURL}/api/admin/authors/user/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El autor ${clickedRow.first_name} ${clickedRow.last_name} ha sido eliminado.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudo eliminar el autor ${clickedRow.first_name} ${clickedRow.last_name}`;
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
          <p>{`¿Está seguro que quiere eliminar el autor
          ${clickedRow.first_name} ${clickedRow.last_name}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteAuthor}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAuthorModal;
