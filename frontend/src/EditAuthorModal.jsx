import { useState } from "react";
import useCheckUser from "./useCheckUser";

function EditAuthorModal({ row, closeEditModal, pageIndex }) {
  useCheckUser();

  const [firstName, setFirstName] = useState(row.first_name);
  const [lastName, setLastName] = useState(row.last_name);
  const [country, setCountry] = useState(row.country);
  const [referido, setReferido] = useState(row.referido);
  const [email, setEmail] = useState(row.email);
  const [category, setCategory] = useState(row.category);

  async function editAuthor() {
    try {
      const response = await fetch('http://localhost:3000/admin/user', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          first_name: firstName,
          last_name: lastName,
          country: country,
          referido: referido,
          email: email,
          category: category
        })
      });

      if (response.ok === true) {
        closeEditModal(pageIndex);
        alert(`Successfully updated ${row.first_name} ${row.last_name}`);
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <form>
          <input type="text" placeholder={`${row.first_name}`}
            onChange={(e)=>setFirstName(e.target.value)}></input>
          <input type="text" placeholder={`${row.last_name}`}
            onChange={(e)=>setLastName(e.target.value)}></input>
          <input type="text" placeholder={`${row.country}`}
            onChange={(e)=>setCountry(e.target.value)}></input>
          <input type="text" placeholder={`${row.referido}`}
            onChange={(e)=>setReferido(e.target.value)}></input>
          <input type="text" placeholder={`${row.email}`}
            onChange={(e)=>setEmail(e.target.value)}></input>
          <input type="text" placeholder={`${row.category}`}
            onChange={(e)=>setCategory(e.target.value)}></input>
        </form>
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={closeEditModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={editAuthor}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default EditAuthorModal;
