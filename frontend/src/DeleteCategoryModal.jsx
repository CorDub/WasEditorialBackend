import useCheckUser from "./useCheckUser";

function DeleteCategoryModal( {row, closeDeleteModal, pageIndex, globalFilter }) {
  useCheckUser();

  async function deleteCategory() {
    try {
      const response = await fetch(`http://localhost:3000/admin/category?category_id=${row.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `La categoría ${row.type} ha sido eliminada con exito.`
        closeDeleteModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar la categoría ${row.type}`;
        closeDeleteModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting category', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar la categoria ${row.type}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeDeleteModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteCategory}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCategoryModal;
