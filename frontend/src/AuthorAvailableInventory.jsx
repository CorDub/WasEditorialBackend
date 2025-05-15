import "./AuthorAvailableInventory.scss"
import { useEffect, useState } from "react";
import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";

function AuthorAvailableInventory({bookSales, selectedBookId}) {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const [bookstoreData, setBookstoreData] = useState(null);
  const [isBookstoreDataDisplayed, setBookstoreDataDisplayed] = useState(false);

  useEffect(() => {
    setData(bookSales.sort((a, b) => b.summary.total - a.summary.total));
  }, [bookSales]);

  useEffect(() => {
    if (data) {
      setMax(data[0].summary.total);
    }
  }, [data]);

  async function fetchBookInventoriesByBookstore() {
    try {
      const response = await fetch(`http://localhost:3000/author/bookInventories?bookId=${selectedBookId}`, {
        method: "GET",
        headers: {
          'Content-Type': 'applciation/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        const sorted = data.sort((a, b) => (b.current - a.current));
        setBookstoreData(sorted);
        setMax(sorted[0].current);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (selectedBookId !== '') {
      fetchBookInventoriesByBookstore();
      setBookstoreDataDisplayed(true);
    } else {
      setBookstoreDataDisplayed(false);
      if (data) {
        setMax(data[0].summary.total)
      }
    }
  }, [selectedBookId, data]);

  return (
    <div className="author-available-inventory">
      {data && !isBookstoreDataDisplayed && (
        <>
          {data.map((book, index) =>(
            <HorizontalGraphLine
              key={index}
              max={max}
              number={book.summary.total}
              legend={book.title} />))}
          <XAxis max={max} />
        </>
      )}
      {isBookstoreDataDisplayed && bookstoreData && (
        <>
          {bookstoreData.map((bookstore, index) => (
            <HorizontalGraphLine
              key={index}
              max={max}
              number={bookstore.current}
              legend={bookstore.name}
              color={bookstore.color}/>))}
          <XAxis max={max}/>
        </>
      )}
    </div>
  )
}

export default AuthorAvailableInventory;
