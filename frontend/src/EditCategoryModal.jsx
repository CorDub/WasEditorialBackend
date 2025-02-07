import { useState } from "react";
import useCheckUser from "./useCheckUser";

function EditCategoryModal({ row, closeEditModal }) {
  useCheckUser();
  const [tipo, setTipo] = useState(row.type);
  const [regalias, setRegalias] = useState(row.percentage_royalties);
  const [gestionTiendas, setGestionTiendas] = useState(row.percentage_management_stores);
  const [gestionMinima, setGestionMinima] = useState(row.management_min);

  async function editCategory() {
    try {
      const response = await fetch('http://localhost:3000/admin/category', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          tipo: tipo,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
        })
      });

      if (response.ok === true) {
        closeEditModal();
        alert(`Actualizó categoria ${row.type} con exito`);
      }

    } catch(error) {
      console.error("Error on frontend sending edit category info:", error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <form>
          <input type="text" placeholder={`${row.type}`}
            onChange={(e)=>setTipo(e.target.value)}></input>
          <input type="text" placeholder={`${row.percentage_royalties}`}
            onChange={(e)=>setRegalias(e.target.value)}></input>
          <input type="text" placeholder={`${row.percentage_management_stores}`}
            onChange={(e)=>setGestionTiendas(e.target.value)}></input>
          <input type="text" placeholder={`${row.management_min}`}
            onChange={(e)=>setGestionMinima(e.target.value)}></input>
        </form>
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={closeEditModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={editCategory}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default EditCategoryModal;
