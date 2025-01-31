import { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import "./ChangePasswordPage.scss";

function ChangePasswordPage() {
  const [cs1, setCs1] = useState('');
  const [cs2, setCs2] = useState('');
  const location = useLocation();
  const { user_id } = location.state || {};
  const navigate = useNavigate();

  async function handleSubmit(e) {
    if (cs1 !== cs2) {
      alert("La contraseña no fue la misma en ambos campos.");
      return;
    };

    e.preventDefault();

    const response = await fetch('/api/change_password', {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user_id,
        password: cs1
      })
    });

    if (response.ok === true) {
      navigate(`/author/${user_id}`);
    } else {
      alert("There was an issue updating the password.");
    };
  }

  return(
    <div className="chapas">
      <div>
        <p>Cambiar contraseña</p>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder="Nueva contraseña"
          onChange={(e) => setCs1(e.target.value)}></input>
        <input type="password" placeholder="Confirma nueva contraseña"
          onChange={(e) => setCs2(e.target.value)}></input>
        <button type="submit">Ingresar</button>
      </form>
    </div>
  )
}

export default ChangePasswordPage;
