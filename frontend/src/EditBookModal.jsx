import { useState, useEffect } from "react";
import useCheckUser from "./useCheckUser";

function EditBookModal({ row, closeEditModal }) {
  useCheckUser();

  const [title, setTitle] = useState(row.title);
  const [pasta, setPasta] = useState(row.pasta);
  const [price, setPrice] = useState(row.price);
  const [isbn, setIsbn] = useState(row.isbn);
  const [authors, setAuthors] = useState(row.users);
  const [existingAuthors, setExistingAuthors] = useState(null);

  console.log(authors);

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

  async function editBook() {
    const authors_ids = [];
    authors.map((author) => {
      authors_ids.push(author.id)
    })
    try {
      const response = await fetch('http://localhost:3000/admin/book', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: row.id,
          title: title,
          pasta: pasta,
          price: price,
          isbn: isbn,
          authors: authors_ids,
        })
      });

      if (response.ok === true) {
        closeEditModal();
        alert(`Successfully updated ${row.title}`);
      }

    } catch(error) {
      console.error("Error on frontend sending edit info:", error);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        <form>
        <input type='text' placeholder={title}
          onChange={(e) => setTitle(e.target.value)}></input>
        <select onChange={(e) =>setPasta(e.target.value)}>
          <option>{row.pasta}</option>
          <option value="Blanda">Blanda</option>
          <option value="Dura">Dura</option>
        </select>
        <input type='text' placeholder={price}
          onChange={(e) => setPrice(e.target.value)}></input>
        <input type='text' placeholder={isbn}
          onChange={(e) => setIsbn(e.target.value)}></input>
        {authors.map((author, index) => (
          <div key={index}>
            <select onChange={(event) => authorsChange(index, event)}>
              <option key={index}>{authors[index].first_name} {authors[index].last_name}</option>
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
        </form>
        <div className="modal-actions">
          <button className='blue-button modal-button'
              onClick={closeEditModal}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={editBook}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default EditBookModal;
