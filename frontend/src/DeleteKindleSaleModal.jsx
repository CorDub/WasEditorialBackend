import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteKindleSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function deleteKindleSale() {
    try {
      const response = await fetch(`${baseURL}/api/admin/kindlesales/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });

      if (response.ok) {
        const alertMessage = `La venta ha sido eliminada con exito`;
        closeModal(globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar la venta.`;
        closeModal(globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting sale', error)
    }
  }
  
  return(
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere eliminar esta venta Kindle de ${clickedRow.book.title}?`}</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteKindleSale}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteKindleSaleModal;