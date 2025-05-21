import "./DeleteAuthorModal.scss"
import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteAuthorModal({ row, closeDeleteModal, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteAuthor(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${baseURL}/admin/user?user_id=${row.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El autor ${row.first_name} ${row.last_name} ha sido eliminado.`;
        closeDeleteModal(globalFilter, true, alertMessage, "confirmation");
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
