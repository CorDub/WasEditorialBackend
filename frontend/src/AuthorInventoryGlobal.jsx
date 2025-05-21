import XAxis from "./XAxis";
import { useState, useEffect } from "react";
import "./AuthorInventoryGlobal.scss";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import Legend from "./Legend";

function AuthorInventoryGlobal({bookSales, selectedBookId}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Disponibles', '#E2E2E2'],
  ]
  const [legendDisplays, setLegendDisplays] = useState({
    'Entregados al autor': true,
    'Vendidos': true,
    'Disponibles': true
  });
  const [bookData, setBookData] = useState(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState("");

  // useEffect(() => {
  //   console.log(legendDisplays);
  // }, [legendDisplays])

  // useEffect(() => {
  //   let legendDisplays = {};
  //   for (const value in legendValues) {
  //     console.log(value);
  //     legendDisplays[value[0]] = true;
  //   }
  //   setLegendDisplays(legendDisplays);
  // }, [legendValues])

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
      const response = await fetch(`${baseURL}/author/bookInventories?bookId=${selectedBookId}`, {
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
          initial={legendDisplays['Disponibles'] ? book.summary.initial : 0}
          sold={legendDisplays['Vendidos'] ? book.summary.sold : 0}
          given={legendDisplays['Entregados al autor'] ? book.summary.givenToAuthor : 0}
          max={max} />))}
      {bookData && bookData.map((bookstore, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={bookstore.name}
          initial={legendDisplays['Disponibles'] ? bookstore.initial : 0}
          sold={legendDisplays['Vendidos']
            ? bookstore.initial - (bookstore.current + bookstore.given + bookstore.returns)
            : 0}
          given={legendDisplays['Entregados al autor'] ? bookstore.given : 0}
          max={max}/>
      ))}
      <XAxis max={max} />
      <Legend
        values={legendValues}
        displays={legendDisplays}
        setDisplays={setLegendDisplays}/>
    </div>
  )
}

export default AuthorInventoryGlobal;
