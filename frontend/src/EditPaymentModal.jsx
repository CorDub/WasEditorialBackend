import { useEffect, useState } from "react";
import useCheckAdmin from "./customHooks/useCheckAdmin";

function EditPaymentModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const months = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre"
};
  const [periodo, setPeriodo] = useState('');

  useEffect(() => {
    const date = clickedRow.forMonth;
    const month = date.substring(5,7);
    const year = date.substring(0,4);
    setPeriodo(months[month] + " " + year)
  }, [clickedRow])

  async function markPaymentAsPaid() {
    try {
      const response = await fetch(`${baseURL}/api/admin/payments/markAsPaid/${clickedRow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      })

      if (response.ok) {
        const alertMessage = 'El pago ha estado marcado como pagado existosamente.';
        closeModal(globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = 'No se pudó marcar como pagado.';
        closeModal(globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error(error)
    }
  }

  return(
    <div className="modal-proper">
      <div className="delmod-confirm">
        <p>{`¿Está seguro que quiere marcar el pago de $ ${clickedRow.amount.toFixed(2)} para el mes de ${periodo} a ${clickedRow.user.first_name} ${clickedRow.user.last_name}`} como pagado?</p>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
        <button className='blue-button modal-button'
          onClick={markPaymentAsPaid}>Confirmar</button>
      </div>
    </div>
  )
}

export default EditPaymentModal;
