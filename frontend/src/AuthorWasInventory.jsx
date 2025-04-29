import { useState, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";
import "./AuthorWasInventory.scss";

function AuthorWasInventory() {
  useCheckUser();
  const [data, setData] = useState(null);
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
        <HorizontalGraphLine
          key={index}
          max={max}
          number={book.current}
          legend={book.title} />))}
      <XAxis max={max}/>
    </div>
  )
}

export default AuthorWasInventory;
