import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";

function AuthorInventory(){
  const { user } = useContext(UserContext);
  const params = useParams();
  const page_id = parseInt(params.id);
  const [inventories, setInventories] = useState([])
  const [books, setBooks] = useState([])


  console.log(page_id);

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



  return (
    <>
      <Navbar subNav={user.role} active={"autores"}/>
      <h1>Yeah this is the AuthorInventory page number</h1>
      {books && books.map((book) => (
        <ul key={book.id}>
          <li>{book.title}</li>
        </ul>
      ))}
    </>
  )
}

export default AuthorInventory;
