import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteSaleModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  console.log(clickedRow);

  async function deleteSale() {
    try {
      const response = await fetch(`http://localhost:3000/admin/sale?sale_id=${clickedRow.id}&inventory_id=${clickedRow.inventoryId}&quantity=${clickedRow.quantity}`, {
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
        <p>{`¿Está seguro que quiere eliminar la venta ${clickedRow.completeInventory}?`}</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={deleteSale}>Confirmar</button>
      </div>
    </div>
  )
}

export default DeleteSaleModal;
