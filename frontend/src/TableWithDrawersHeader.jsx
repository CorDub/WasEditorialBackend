import "./TableWithDrawersHeader.scss";
import DateRange from "./DateRange";
// import { useEffect, useState } from 'react';

function TableWithDrawersHeader({
  openModal,
  bookstoresInMonth,
  selectedBookstore,
  setSelectedBookstore,
  booksInMonth,
  selectedBook,
  setSelectedBook,
  authorsInMonth,
  selectedAuthor,
  setSelectedAuthor,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  applyFilters
}) {

  // const [bookstoreList, setBookstoreList] = useState(bookstoresInMonth)
  // const [bookList, setBookList] = useState(booksInMonth)
  // const [authorList, setAuthorList] = useState(authorsInMonth);

  // function prepareOptionsList(list, value, base) {
  //   if (list.includes(value)) {
  //     const removed = list.filter((element) => element === value)
  //     removed.splice(0, 0, value, base)
  //     return removed
  //   } else {
  //     list.splice(0, 0, base)
  //     return list
  //   }
  // }

  // useEffect(() => {
  //   setBookstoreList(prepareOptionsList(bookstoreList, selectedBookstore, "Todas las librerías"))
  //   setBookList(prepareOptionsList(bookList, selectedBook, "Todos los libros"))
  //   setAuthorList(prepareOptionsList(authorList, selectedAuthor, "Todos los autores"))
  // }, [selectedBook, selectedBookstore, selectedAuthor])

  return(
    <div className="twdh">
      <button className="blue-button"
        onClick={() => {openModal("adding")}}>
        Añadir nueva venta
      </button>
      <div className="twdh-filtrar">
        <DateRange 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}/>
        <select className="twdh-select"
          value={selectedBookstore}
          onChange={(e) => setSelectedBookstore(e.target.value)}>
            <option value="">Todas las librerías</option>
          {bookstoresInMonth && bookstoresInMonth.map((bookstore, index) => (
            <option key={index}>{bookstore}</option>
          ))}
        </select>
        <select className="twdh-select"
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}>
            <option value="">Todos los libros</option>
          {booksInMonth && booksInMonth.map((book, index) => (
            <option key={index}>{book}</option>
          ))}
        </select>
        <select className="twdh-select"
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}>
            <option value="">Todos los autores</option>
          {authorsInMonth && authorsInMonth.map((author, index) => (
            <option key={index}>{author}</option>
          ))}
        </select>
        <button className="blue-button"
          onClick={() => applyFilters()}>
          Aplicar filtros</button>
      </div>
    </div>
  )
}

export default TableWithDrawersHeader;