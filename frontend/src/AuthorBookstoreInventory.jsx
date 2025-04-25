import { useState, useEffect } from "react";

function AuthorBookstoreInventory() {
  const [data, setData] = useState(null);

  async function fetchAuthorBookstoreInventories() {
    try{
      const response = await fetch("http://localhost:3000/author/bookstoreInventories", {
        method: "GET",
        headers: {
          "Content-Type": 'application/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAuthorBookstoreInventories();
  }, [])

  useEffect(() => {
    console.log(data);
  }, [data])

  return(
    <div className="author-bookstore-inventory">
      <div>Yeah author bookstore inventory</div>
    </div>
  )
}

export default AuthorBookstoreInventory;
