import useCheckUser from "./useCheckUser";

function DeleteCategoryModal( {row, closeDeleteModal }) {
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
        closeDeleteModal;
      }

    } catch (error) {
      console.error('Error while deleting category', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeDeleteModal}>
      <div className="modal-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar la categoria ${row.type}?`}</p>
        </div>
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={closeDeleteModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteCategory}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCategoryModal;
