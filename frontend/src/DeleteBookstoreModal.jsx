import useCheckUser from "./useCheckUser";

function DeleteBookstoreModal({ row, closeDeleteModal, pageIndex, globalFilter }) {
  useCheckUser();

  async function deleteBookstore() {
    try {
      const response = await fetch(`http://localhost:3000/admin/bookstore?bookstore_id=${row.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `La librería ${row.name} ha sido eliminada con exito.`;
        closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar la librería ${row.name}`;
        closeDeleteModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting bookstore', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar la librería
          ${row.name}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteBookstore}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookstoreModal;
