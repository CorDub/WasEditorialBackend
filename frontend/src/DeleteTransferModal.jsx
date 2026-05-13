import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteTransfer() {
    try {
      const response = await fetch(`${baseURL}/api/admin/transfers/transfer/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `El movimiento ha sido eliminada con exito`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        if (response.status === 400) {
          const decodedResponse = await response.json()
          const alertMessage = decodedResponse.error;
          closeModal(pageIndex, globalFilter, false, alertMessage, "error");
        } else {
          const alertMessage = `No se pudó eliminar el movimiento.`;
          closeModal(pageIndex, globalFilter, false, alertMessage, "error");
        }
      }

    } catch (error) {
      console.error('Error while deleting el movimiento', error)
    }
  }

  return(
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar el movimiento de ${clickedRow.quantity} libros de ${clickedRow.fromInventory.book.title} del ${clickedRow.dateStr}?`}</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteTransfer}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteTransferModal;
