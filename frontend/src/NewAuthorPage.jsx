import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from './UserContext';

function NewAuthorPage() {
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [country, setCountry] = useState(null);
  const [referido, setReferido] = useState(null);
  const [email, setEmail] = useState(null);
  const [category, setCategory] = useState(null);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user !== undefined && (user === null || user.is_admin === false)) {
      navigate("/");
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/admin/user', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          country: country,
          referido: referido,
          email: email,
          category: category
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
      } else {
        const data = await response.json();
        alert(`Un nuevo author ${data.name} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`);
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type='text' placeholder="Nombre"
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido"
          onChange={(e) => setLastName(e.target.value)}></input>
        <input type='text' placeholder="Pais"
          onChange={(e) => setCountry(e.target.value)}></input>
        <input type='text' placeholder="Referido (opcional)"
          onChange={(e) => setReferido(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          onChange={(e) => setEmail(e.target.value)}></input>
        <input type='text' placeholder="Categoria"
          onChange={(e) => setCategory(e.target.value)}></input>
        <button type='submit'>Añadir nuevo autor</button>
      </form>
    </>
  )
}

export default NewAuthorPage;
