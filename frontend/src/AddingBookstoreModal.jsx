import { useState } from 'react';
import useCheckUser from './useCheckUser';

function AddingBookstoreModal({ closeAddingModal }) {
  useCheckUser();

  const [name, setName] = useState(null);
  const [dealPercentage, setDealPercentage] = useState(null);
  const [contactName, setContactName] = useState(null);
  const [contactPhone, setContactPhone] = useState(null);
  const [contactEmail, setContactEmail] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/admin/bookstore', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          name: name,
          dealPercentage: dealPercentage,
          contactName: contactName,
          contactPhone: contactPhone,
          contactEmail: contactEmail,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear una nueva librería.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Una nueva librería ${data.name} ha sido creado en la database.`);
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
          onChange={(e) => setName(e.target.value)}></input>
        <input type='text' placeholder="% Acuerdo"
          onChange={(e) => setDealPercentage(e.target.value)}></input>
        <input type='text' placeholder="Nombre del contacto"
          onChange={(e) => setContactName(e.target.value)}></input>
        <input type='text' placeholder="Téléfono"
          onChange={(e) => setContactPhone(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          onChange={(e) => setContactEmail(e.target.value)}></input>
        <button type='submit'>Añadir nueva librería</button>
      </form>
      </div>
    </div>
  )
}

export default AddingBookstoreModal;
