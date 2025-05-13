import "./BooksSoldGraph.scss";
import { useState, useEffect } from "react";
import XAxis from "./XAxis";
import HorizontalGraphLine from "./HorizontalGraphLine";

function BooksSoldGraph({bookSales, selectedBookId}) {
  const [booksListBySales, setBooksListBySales] = useState([]);
  const [max, setMax] = useState(0);
  const [bookstoreData, setBookstoreData] = useState(null);
  const [isBookstoreDataDisplayed, setBookstoreDataDisplayed] = useState(false);

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
      const response = await fetch(`http://localhost:3000/author/bookInventories?bookId=${selectedBookId}`, {
        method: "GET",
        headers: {
          'Content-Type': "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => (b.initial - b.current -b.given - b.returns) - (a.initial - a.current - a.given - a.returns));
        console.log(sorted);
        setBookstoreData(sorted);
        setMax(sorted[0].initial - sorted[0].current - sorted[0].given - sorted[0].returns);
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
      setMax(booksListBySales[0].summary.sold)
    }
  }, [selectedBookId]);

  useEffect(() => {
    console.log(bookstoreData)
  }, [bookstoreData]);

  return(
    <div className="books-sold-graph">
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
              legend={bookstore.name}/>))}
          <XAxis max={max}/>
        </>
      )}
    </div>
  )
}

export default BooksSoldGraph;
