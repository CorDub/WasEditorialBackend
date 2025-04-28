import { useState, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import BooksSoldGraphLine from "./BooksSoldGraphLine";
import CustomXAxis from "./CustomXAxis";
import "./AuthorWasInventory.scss";

function AuthorWasInventory() {
  useCheckUser();
  const [data, setData] = useState([]);
  const [max, setMax] = useState(0);

  async function fetchAuthorBookstoreInventories() {
    try{
      const response = await fetch("http://localhost:3000/author/wasInventories", {
        method: "GET",
        headers: {
          "Content-Type": 'application/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const dataArray = Object.values(data);
        const sorted = dataArray.sort((a, b) => b.current - a.current);
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
    <div className="author-was-inventory">
      {data && data.map((book, index) => (
        <BooksSoldGraphLine
        key={index}
        bookData={book}
        max={max} />))}
      <CustomXAxis max={max}/>
    </div>
  )
}

export default AuthorWasInventory;
