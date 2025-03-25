import ProgressBar from "./ProgressBar";

function BookstoreInventoryTotal({selectedBookstore, selectedLogo, currentTotal, initialTotal}) {

  return(
    <div className="bookstore-inventory-total">
      <img src={selectedLogo} className="bookstore-inventory-img"/>
      <div>Total vendidos: {initialTotal - currentTotal} / {initialTotal}</div>
      <div>Total disponibles: {currentTotal} / {initialTotal}</div>
      <ProgressBar current={currentTotal} initial={initialTotal} />
    </div>
  )
}

export default BookstoreInventoryTotal;
