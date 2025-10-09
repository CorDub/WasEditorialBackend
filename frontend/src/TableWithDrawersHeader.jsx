import "./TableWithDrawersHeader.scss";
import DateRange from "./DateRange";

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
  refetchAndFilter,
  salesType
}) {

  return(
    <div className="twdh">
      <button className="blue-button"
        onClick={() => {openModal("adding")}}>
        Añadir nueva venta {salesType && salesType === "kindle" && "Kindle"}
      </button>
      <div className="twdh-filtrar">
        <DateRange 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}/>
        {salesType && salesType === "normal" && (
          <select className="twdh-select"
            value={selectedBookstore}
            onChange={(e) => setSelectedBookstore(e.target.value)}>
              <option value="">Todas las librerías</option>
            {bookstoresInMonth && bookstoresInMonth.map((bookstore, index) => (
              <option key={index}>{bookstore}</option>
            ))}
          </select>)
        }
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
          onClick={() => refetchAndFilter()}>
          Aplicar filtros</button>
      </div>
    </div>
  )
}

export default TableWithDrawersHeader;