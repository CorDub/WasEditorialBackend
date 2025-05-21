import { useState, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";
import "./AuthorWasInventory.scss";

function AuthorWasInventory({booksInventories, selectedBookId}) {
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [isBookDataDisplayed, setBookDataDisplayed] = useState(false);
  const [bookData, setBookData] = useState(null);

  async function fetchAuthorBookstoreInventories() {
    try{
      const response = await fetch(`${baseURL}/author/wasInventories`, {
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

  useEffect(() => {
    if (selectedBookId !== '') {
      for (const book of booksInventories) {
        if (book.bookId === selectedBookId) {
          const bookDataArray = Object.entries(book.summary.wasPerCountry);
          const sorted = bookDataArray.sort((a, b) => b[1] - a[1]);
          setBookData(sorted);
          setMax(sorted[0][1]);
          setSelectedBookTitle(book.title);
          setBookDataDisplayed(true);
        }
      }
    } else {
      setSelectedBookTitle('Todos los titulos');
      setBookDataDisplayed(false);
    }
  }, [booksInventories, selectedBookId])

  console.log(max);

  return(
    <div className="author-was-inventory">
      <div className="aig-title"><h2>{selectedBookTitle}</h2></div>
      {data && !isBookDataDisplayed && data.map((book, index) => (
        <HorizontalGraphLine
          key={index}
          max={max}
          number={book.current}
          legend={book.title} />))}
      {isBookDataDisplayed && bookData && bookData.map((country, index) => (
        country[1] > 0 && (
          <HorizontalGraphLine
            key={index}
            max={max}
            number={country[1]}
            legend={country[0]} />)))}
      <XAxis max={max}/>
    </div>
  )
}

export default AuthorWasInventory;
