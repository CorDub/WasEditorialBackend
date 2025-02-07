import { useEffect, useState } from 'react';
import useCheckUser from './useCheckUser';

function AddingBookModal({ closeAddingModal }) {
  useCheckUser();

  const [title, setTitle] = useState(null);
  const [pasta, setPasta] = useState(null);
  const [price, setPrice] = useState(null);
  const [isbn, setIsbn] = useState(null);
  const [author, setAuthor] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/admin/book', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          title: title,
          pasta: pasta,
          price: price,
          isbn: isbn,
          author: author,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('No se pude crear un nuveo libro.');
        closeAddingModal();
      } else {
        const data = await response.json();
        alert(`Un nuevo libro ${data.title} ha sido creado.`);
        closeAddingModal();
      }

    } catch(error) {
      console.error(error);
    }
  }

  useEffect(()=>{
    console.log(pasta)
  }, [pasta])

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
      <form onSubmit={handleSubmit}>
        <input type='text' placeholder="Titulo"
          onChange={(e) => setTitle(e.target.value)}></input>
        <select onChange={(e) =>setPasta(e.target.value)}>
          {/* <option value="Blanda">Pasta</option> */}
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' placeholder="Precio"
          onChange={(e) => setPrice(e.target.value)}></input>
        <input type='text' placeholder="ISBN"
          onChange={(e) => setIsbn(e.target.value)}></input>
        <input type='text' placeholder="Autor"
          onChange={(e) => setAuthor(e.target.value)}></input>
        <button type='submit'>Añadir nuevo libro</button>
      </form>
      </div>
    </div>
  )
}

export default AddingBookModal;
