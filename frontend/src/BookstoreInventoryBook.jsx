import ProgressBar from "./ProgressBar";

function BookstoreInventoryBook({title, current, initial}) {
  return(
    <div className="bookstore-inventory-book">
      <p className="bookstore-inventory-book-title">{title}</p>
      <p className="bookstore-inventory-book-vendidos">{initial-current} / {initial}</p>
      <p className="bookstore-inventory-book-disponibles">{current} / {initial}</p>
      <ProgressBar current={current} initial={initial} />
    </div>
  )
}

export default BookstoreInventoryBook
