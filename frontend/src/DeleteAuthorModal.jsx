import "./DeleteAuthorModal.scss"

function DeleteAuthorModal({ row, closeDeleteModal }) {
  console.log(row.id);

  async function deleteAuthor() {
    try {
      const response = await fetch('http://localhost:3000/admin/user', {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: {
          user_id: row.id
        }
      });

      if (response.ok) {
        closeDeleteModal;
        alert("User deleted successfully");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="delmod-overlay" onClick={closeDeleteModal}>
      <div className="delmod-proper">
        <div className="delmod-confirm">
          <p>{`¿Está seguro que quiere eliminar el autor
          ${row.first_name} ${row.last_name}?`}</p>
        </div>
        <div className="delmod-actions">
          <button className='blue-button delmod-button'
            onClick={closeDeleteModal}>Cancelar</button>
          <button className='blue-button delmod-button'
            onClick={deleteAuthor}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAuthorModal;
