import { useState } from "react";
import useCheckUser from "./useCheckUser";

function EditBookstoreModal({ row, closeEditModal }) {
  useCheckUser();
  console.log(row)

  const [name, setName] = useState(row.name);
  const [dealPercentage, setDealPercentage] = useState(row.deal_percentage);
  const [contactName, setContactName] = useState(row.contact_name);
  const [contactPhone, setContactPhone] = useState(row.contact_phone);
  const [contactEmail, setContactEmail] = useState(row.contact_email);

  async function editBookstore() {
    try {
      const response = await fetch('http://localhost:3000/admin/bookstore', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: contactPhone,
          contactEmail: contactEmail,
        })
      });

      if (response.ok === true) {
        closeEditModal();
        alert(`Successfully updated ${row.name}`);
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <form>
          <input type='text' placeholder={name}
            onChange={(e) => setName(e.target.value)}></input>
          <input type='text' placeholder={dealPercentage}
            onChange={(e) => setDealPercentage(e.target.value)}></input>
          <input type='text' placeholder={contactName}
            onChange={(e) => setContactName(e.target.value)}></input>
          <input type='text' placeholder={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}></input>
          <input type='text' placeholder={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}></input>
        </form>
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={closeEditModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={editBookstore}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default EditBookstoreModal;
