import "./DeleteAuthorModal.scss"
import useCheckUser from "./customHooks/useCheckUser";

function DeleteAuthorModal({ row, closeDeleteModal, pageIndex, globalFilter }) {
  useCheckUser();
  console.log(row);

  async function deleteAuthor(e) {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/admin/user?user_id=${row.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El autor ${row.first_name} ${row.last_name} ha sido eliminado.`;
        closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudo eliminar el autor ${row.first_name} ${row.last_name}`;
        closeDeleteModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeDeleteModal}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar el autor
          ${row.first_name} ${row.last_name}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteAuthor}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAuthorModal;
