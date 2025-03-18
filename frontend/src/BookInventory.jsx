import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import ShowInventory from "./ShowInventories";

function BookInventory(props){

  const bookId = props.bookId
  const [inventories, setInventories] = useState("")


  useEffect(()=>{
    async function fetchInventories() {
      try {
        const response = await fetch(`http://localhost:3000/author/books/${bookId}/inventories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setInventories(data);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (bookId) fetchInventories();
  },[bookId])

  if (!bookId) return <p>Loading...</p>;

  return(
    <>    
      {inventories && <ShowInventory inventories={inventories}/>}
    </>

  )

}

export default BookInventory;
