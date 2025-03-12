import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";

function AuthorPage() {
  const { user } = useContext(UserContext);
  const params = useParams();
  const page_id = parseInt(params.id);
  const [inventories, setInventories] = useState([])

  console.log(page_id);

  useCheckUser(page_id);

  useEffect(()=>{
    fetchInventories()
    console.log(inventories)
  },[])

  async function fetchInventories() {
    try {
      const response = await fetch('http://localhost:3000/author/books/1/inventories', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setInventories(data);
      }
    } catch (error) {
      console.error(error);
    }
  }



  return (
    <>
      <Navbar subNav={user.role} active={"autores"}/>
      <h1>Yeah this is the author page number {page_id && page_id}</h1>
      {inventories && inventories.map((inventory) => (
        <ul key={inventory.id}>
          <li>{inventory.id}</li>
          <li>{inventory.book}</li>
          <li>{inventory.country}</li>
          <li>{inventory.initial}</li>
        </ul>
      ))}
    </>
  )
};

export default AuthorPage;
