import "./BooksSoldGraph.scss";
import { useState, useEffect } from "react";
import XAxis from "./XAxis";
import HorizontalGraphLine from "./HorizontalGraphLine";
import useCheckUser from "./customHooks/useCheckUser";

function BooksSoldGraph({bookSales, selectedBookId}) {
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [booksListBySales, setBooksListBySales] = useState([]);
  const [max, setMax] = useState(0);
  const [bookstoreData, setBookstoreData] = useState(null);
  const [isBookstoreDataDisplayed, setBookstoreDataDisplayed] = useState(false);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');

  function sortBooksBySales() {
    let sorted = [...bookSales];
    sorted.sort((a,b) => b.summary.sold - a.summary.sold);
    setBooksListBySales(sorted);
  }

  useEffect(() => {
    sortBooksBySales();
  }, [bookSales])

  //Make sure booksListBySales[0] exists before passing it to XAxis
  useEffect(() => {
    if (booksListBySales.length > 0) {
      setMax(booksListBySales[0].summary.sold)
    }
  }, [booksListBySales])

  async function fetchBookInventoriesByBookstore() {
    try {
      const response = await fetch(`${baseURL}/author/bookInventories?bookId=${selectedBookId}`, {
        method: "GET",
        headers: {
          'Content-Type': "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => (b.initial - b.current -b.given - b.returns) - (a.initial - a.current - a.given - a.returns));
        setBookstoreData(sorted);
        setMax(sorted[0].initial - sorted[0].current - sorted[0].given - sorted[0].returns);
        setSelectedBookTitle(sorted[0].title);
      }

    } catch(error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (selectedBookId !== '') {
      fetchBookInventoriesByBookstore();
      setBookstoreDataDisplayed(true);
    } else {
      setBookstoreDataDisplayed(false);
      if (booksListBySales.length > 0) {
        setMax(booksListBySales[0].summary.sold)
      }
    }
  }, [selectedBookId, bookSales]);

  return(
    <div className="books-sold-graph">
      <div className="aig-title"><h2>{booksListBySales && !bookstoreData ? "Todos los titulos" : selectedBookTitle}</h2></div>
      {booksListBySales && !isBookstoreDataDisplayed && (
        <>
          {booksListBySales.map((book, index) => (
            <HorizontalGraphLine
              key={index}
              max={max}
              number={book.summary.sold}
              legend={book.title}/>))}
          <XAxis max={max}/>
        </>)}
      {isBookstoreDataDisplayed && bookstoreData && (
        <>
          {bookstoreData.map((bookstore, index) => (
            <HorizontalGraphLine
              key={index}
              max={max}
              number={bookstore.initial - bookstore.current - bookstore.given - bookstore.returns}
              legend={bookstore.name}
              color={bookstore.color}/>))}
          <XAxis max={max}/>
        </>
      )}
    </div>
  )
}

export default BooksSoldGraph;
