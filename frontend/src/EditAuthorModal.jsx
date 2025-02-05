import { useState } from "react";
import useCheckUser from "./useCheckUser";

function EditAuthorModal({ row, closeEditModal }) {
  useCheckUser();
  console.log(row);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [referido, setReferido] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="delmod-overlay" onClick={closeEditModal}>
      <div className="delmod-proper">
        <form>
          <input type="text" placeholder={`${row.first_name}`}
            onChange={(e)=>setFirstName(e.target.value)}></input>
          <input type="text" placeholder={`${row.last_name}`}
            onChange={(e)=>setLastName(e.target.value)}></input>
          <input type="text" placeholder={`${row.country}`}
            onChange={(e)=>setCountry(e.target.value)}></input>
        </form>
      </div>
    </div>
  )
}

export default EditAuthorModal;
