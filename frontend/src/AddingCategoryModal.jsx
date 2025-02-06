import { useState } from 'react';
import useCheckUser from './useCheckUser';

function AddingCategoryModal({ closeAddingModal }) {
  useCheckUser();

  const [tipo, setTipo] = useState(null);
  const [regalias, setRegalias] = useState(null);
  const [gestionTiendas, setGestionTiendas] = useState(null);
  const [gestionMinima, setGestionMinima] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/admin/category', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          tipo: tipo,
          regalias: regalias,
          gestionTiendas: gestionTiendas,
          gestionMinima: gestionMinima,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear una nueva categoria.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Una nueva categoria ${data.id} ha sido creado.`);
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
        <input type='text' placeholder="Tipo"
          onChange={(e) => setTipo(e.target.value)}></input>
        <input type='text' placeholder="% Regalias de venta"
          onChange={(e) => setRegalias(e.target.value)}></input>
        <input type='text' placeholder="% Gestion Tiendas"
          onChange={(e) => setGestionTiendas(e.target.value)}></input>
        <input type='text' placeholder="Gestion minima"
          onChange={(e) => setGestionMinima(e.target.value)}></input>
        <button type='submit'>Añadir nueva categoria</button>
      </form>
      </div>
    </div>
  )
}

export default AddingCategoryModal;
