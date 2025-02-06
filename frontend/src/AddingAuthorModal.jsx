import { useState } from 'react';
import useCheckUser from './useCheckUser';

function AddingAuthorModal({ closeAddingModal }) {
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [country, setCountry] = useState(null);
  const [referido, setReferido] = useState(null);
  const [email, setEmail] = useState(null);
  const [category, setCategory] = useState(null);

  useCheckUser();

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
        alert('No se pude crear un nuevo autor.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Un nuevo author ${data.name} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
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
      </div>
    </div>
  )
}

export default AddingAuthorModal;
