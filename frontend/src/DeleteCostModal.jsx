import useCheckAdmin from "./customHooks/useCheckAdmin";

function DeleteCostModal({clickedRow, closeModal, pageIndex, globalFilter}) {
    useCheckAdmin();
    const baseURL = import.meta.env.VITE_API_URL || '';

    async function deleteCost() {
        try {
            const response = await fetch(`${baseURL}/api/admin/cost/${clickedRow.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            if (response.ok) {
                const alertMessage = `El costo ha sido eliminado con exito`;
                closeModal(globalFilter, true, alertMessage, "confirmation");
            } else {
                const alertMessage = `No se pudó eliminar el costo.`;
                closeModal(globalFilter, false, alertMessage, "error");
            }
        } catch (error) {
            console.error(error)
        }
    }

    return(
        <div className="modal-proper">
        <div className="delmod-confirm">
            <p>{`¿Está seguro que quiere eliminar el costo ${clickedRow.amount} para el autor
            ${clickedRow.payment.user.first_name} ${clickedRow.payment.user.last_name}?`}</p>
        </div>
        <div className="modal-actions">
            <button className='blue-button modal-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
            <button className='blue-button modal-button'
            onClick={deleteCost}>Confirmar</button>
        </div>
        </div>
    )
}

export default DeleteCostModal;