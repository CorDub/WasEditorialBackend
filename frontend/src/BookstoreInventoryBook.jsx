import ProgressBar from "./ProgressBar";

function BookstoreInventoryBook({title, current, initial}) {
  return(
    <div className="bookstore-inventory-book">
      <p>{title}</p>
      <ProgressBar current={current} initial={initial} />
    </div>
  )
}

export default BookstoreInventoryBook
