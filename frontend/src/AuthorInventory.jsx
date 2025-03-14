import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import BookInventory from "./BookInventory"; 


function AuthorInventory(){
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState([])
  const [books, setBooks] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");



  // useCheckUser(page_id);

  useEffect(()=>{
    fetchBooks()
    // fetchInventories()
    console.log(inventories)
  },[])

  async function fetchBooks() {
    console.log(user.id)
    try {
      const response = await fetch('http://localhost:3000/author/books', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // async function fetchInventories() {
  //   try {
  //     const response = await fetch('http://localhost:3000/author/books/1/inventories', {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       credentials: 'include'
  //     })

  //     if (response.ok) {
  //       const data = await response.json();
  //       setInventories(data);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  const handleBookChange = (event) =>{
    setSelectedBookId(event.target.value);
  }


  return (
    <>
      <Navbar subNav={user.role} active={"autores"}/>
      <h1>Yeah this is the AuthorInventory page number{user.id}</h1>
      {books && (
          <select onChange={handleBookChange} id="book-select">
            <option value="">--Please choose an option--</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
      )}
      {selectedBookId && <BookInventory bookId={selectedBookId} />}

    </>
  )
}

export default AuthorInventory;
