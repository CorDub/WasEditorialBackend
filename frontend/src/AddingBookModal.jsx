import { useEffect, useState } from 'react';
import useCheckUser from './useCheckUser';

function AddingBookModal({ closeAddingModal }) {
  useCheckUser();

  const [title, setTitle] = useState(null);
  const [pasta, setPasta] = useState(null);
  const [price, setPrice] = useState(null);
  const [isbn, setIsbn] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [existingAuthors, setExistingAuthors] = useState(null);

  async function fetchUsers() {
    try {
      const response = await fetch('http://localhost:3000/admin/users', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setExistingAuthors(data);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [])

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
          authors: authors,
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

  function authorsChange(index, event) {
    const authorsNew = [...authors];
    authorsNew[index] = parseInt(event.target.value);
    setAuthors(authorsNew);
  }

  function addOtherAuthor() {
    setAuthors([...authors, 0]);
  }

  function removeOtherAuthor(indexToRemove) {
    setAuthors(authors.filter((_, index)=> index !== indexToRemove));
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
          <option>Selecciona pasta</option>
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' placeholder="Precio"
          onChange={(e) => setPrice(e.target.value)}></input>
        <input type='text' placeholder="ISBN"
          onChange={(e) => setIsbn(e.target.value)}></input>
        {authors.map((author, index) => (
          <div key={index}>
            <select onChange={(event) => authorsChange(index, event)}>
              <option key={index}>Selecciona un autor</option>
              {existingAuthors && existingAuthors.map((author, index) => {
                return (
                  <>
                    <option key={index} value={`${author.id}`}>
                      {author.first_name} {author.last_name}</option>
                  </>
                )
              })}
            </select>
            {authors.length > 1 &&
              <button type="button" onClick={() => removeOtherAuthor(index)}>Eliminar autor</button>}
          </div>
        ))}
        <button type="button" onClick={addOtherAuthor}>Añadir nuevo autor</button>
        <button type='submit'>Añadir nuevo libro</button>
      </form>
      </div>
    </div>
  )
}

export default AddingBookModal;
