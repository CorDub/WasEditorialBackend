import ProgressBar from "./ProgressBar";

function BookstoreInventoryTotal({selectedBookstore, selectedLogo, currentTotal, initialTotal}) {

  return(
    <div className="bookstore-inventory-total">
      <img src={selectedLogo} className="bookstore-inventory-img"/>
      <ProgressBar current={currentTotal} initial={initialTotal} />
    </div>
  )
}

export default BookstoreInventoryTotal;
