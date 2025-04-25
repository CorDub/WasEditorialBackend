import { useState, useEffect } from "react";
import BooksSoldGraphLine from "./BooksSoldGraphLine";
import CustomXAxis from "./CustomXAxis";
import './AuthorBookstoreInventory.scss';

function AuthorBookstoreInventory() {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);

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
        const byBookstores = Object.values(data.inventoriesByBookstores);
        const sorted = byBookstores.sort((a, b) => b.current - a.current);
        setData(sorted);
        setMax(sorted[0].current);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAuthorBookstoreInventories();
  }, [])

  return(
    <div className="author-bookstore-inventory">
      {data && (
        <>
          {data.map((bookstore, index) => (
            <BooksSoldGraphLine
              key={index}
              bookstoreData={bookstore}
              max={max} />))}
          <CustomXAxis max={max}/>
        </>)}
    </div>
  )
}

export default AuthorBookstoreInventory;
