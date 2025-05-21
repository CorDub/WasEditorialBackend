import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";

function DeleteAdminModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  useCheckSuperAdmin();

  async function deleteAdmin() {
    try {
      const response = await fetch(`${baseURL}/superadmin/admin?user_id=${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El admin ${clickedRow.first_name} ${clickedRow.last_name} ha sido eliminado con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar el admin ${clickedRow.first_name} ${clickedRow.last_name}.`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting user', error)
    }
  }

  return (
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar el admin
        ${clickedRow.first_name} ${clickedRow.last_name}?`}</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteAdmin}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteAdminModal;
