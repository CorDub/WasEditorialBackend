import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgottenPasswordPage() {
  const [correo1, setCorreo1] = useState("")
  const [correo2, setCorreo2] = useState("")
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (correo1 !== correo2) {
        return alert("Los correos ingresados no eran los mismos.");
      }

      const response = await fetch(`http://localhost:3000/api/user?email=${correo1}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok === false) {
        return console.log(response.status);
      };

      if (response.status === 204) {
        return alert("No cuenta con este correo fue encontrada.");
      };

      const data = await response.json();
      navigate("/confirmation-code", {state: {user_id: data.id}});

    } catch(error) {
      console.error("Error on sending forgotten password request:", error)
    }
  }

  return(
    <div className="forpas">
      <p>Ingrese su correo por favor</p>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Correo"
          onChange={(e) => setCorreo1(e.target.value)}></input>
        <input type="text" placeholder="Ingrese de nuevo su correo"
          onChange={(e) => setCorreo2(e.target.value)}></input>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default ForgottenPasswordPage;
