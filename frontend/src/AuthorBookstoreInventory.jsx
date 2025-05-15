import { useState, useEffect } from "react";
import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";
import './AuthorBookstoreInventory.scss';
import useCheckUser from "./customHooks/useCheckUser";

function AuthorBookstoreInventory({selectedBookId}) {
  useCheckUser();
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const [selectedBookTitle, setSelectedBookTitle] = useState("Todos los titulos");

  async function fetchAuthorBookstoreInventories() {
    try{
      const response = await fetch(`http://localhost:3000/author/bookstoreInventories?bookId=${selectedBookId}`, {
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
        if (selectedBookId === "") {
          setSelectedBookTitle("Todos los titulos");
        } else {
          setSelectedBookTitle(sorted[0].title);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAuthorBookstoreInventories();
  }, [selectedBookId])

  return(
    <div className="author-bookstore-inventory">
      <div className="aig-title"><h2>{selectedBookTitle}</h2></div>
      {data && data.map((bookstore, index) => (
        <HorizontalGraphLine
          key={index}
          max={max}
          number={bookstore.current}
          legend={bookstore.name}
          color={bookstore.color} />))}
      <XAxis max={max}/>
    </div>
  )
}

export default AuthorBookstoreInventory;
