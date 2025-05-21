import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteImpressionModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteImpression() {
    try {
      const response = await fetch(`${baseURL}/admin/impression?impression_id=${clickedRow.id}&book_id=${clickedRow.bookId}&quantity=${clickedRow.quantity}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `La impresión ha sido eliminada con exito`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar la impresión.`;
        closeModal(globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting sale', error)
    }
  }

  return(
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar la impresión?`}</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteImpression}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteImpressionModal;
