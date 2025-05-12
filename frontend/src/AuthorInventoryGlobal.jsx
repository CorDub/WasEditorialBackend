import XAxis from "./XAxis";
import { useState, useEffect } from "react";
import "./AuthorInventoryGlobal.scss";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import Legend from "./Legend";

function AuthorInventoryGlobal({bookSales, selectedBookId}) {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Disponibles', '#E2E2E2'],
  ]
  const [bookData, setBookData] = useState(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState("");

  useEffect(() => {
    if (bookSales.length !== 0) {
      const newArrayBookSales = [...bookSales];
      const data = newArrayBookSales.sort((a, b) => b.summary.initial - a.summary.initial);
      setData(data);
      setMax(data[0].summary.initial);
    }
  }, [bookSales]);

  async function fetchAuthorBookInventories() {
    try{
      const response = await fetch(`http://localhost:3000/author/bookInventories?bookId=${selectedBookId}`, {
        method: "GET",
        headers: {
          "Content-Type": 'application/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        // const byBookstores = Object.values(data.inventoriesByBookstores);
        const sorted = data.sort((a, b) => b.initial - a.initial);
        setBookData(sorted);
        setMax(sorted[0].initial);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (selectedBookId !== "" && data) {
      fetchAuthorBookInventories();
      for (const book of data) {
        if (book.bookId === selectedBookId) {
          setSelectedBookTitle(book.title);
          break;
        }
      }
    } else {
      setBookData(null);
      if (data) {
        setMax(data[0].summary.initial);
      }
    }
  }, [selectedBookId, data])

  return(
    <div className="author-inventory-global">
      <div className="aig-title"><h2>{data && !bookData ? "Todos los titulos" : selectedBookTitle}</h2></div>
      {data && !bookData && data.map((book, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={book.title}
          initial={book.summary.initial}
          sold={book.summary.sold}
          given={book.summary.givenToAuthor}
          max={max} />))}
      {bookData && bookData.map((bookstore, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={bookstore.name}
          initial={bookstore.initial}
          sold={bookstore.initial - (bookstore.current + bookstore.given + bookstore.returns)}
          given={bookstore.given}
          max={max}/>
      ))}
      <XAxis max={max} />
      <Legend values={legendValues}/>
    </div>
  )
}

export default AuthorInventoryGlobal;
