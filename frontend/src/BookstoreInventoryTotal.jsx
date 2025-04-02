import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

function BookstoreInventoryTotal({
    selectedBookstore,
    selectedBookstoreNoSpaces,
    selectedLogo,
    currentTotal,
    initialTotal,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen,
    selectedBook,
    setBookInventoryOpen}) {
  const [logo, setLogo] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  // import only the logo you need based on the name
  useEffect(() => {
    import (`./assets/${selectedBookstoreNoSpaces}.png`)
      .then((image) => setLogo(image.default));
  }, [selectedBookstoreNoSpaces])

  //assign name based on either bookstore name or book title
  useEffect(() => {
    if (selectedBook) {
      setName(selectedBook);
      setType("book");
    } else {
      setName(selectedBookstore)
      setType("bookstore");
    }
  }, [selectedBookstore, selectedBook])

  function returnToInventoriesAreaDashboard() {
    if (type === "book") {
      setBookInventoryOpen(false);
    } else {
      setBookstoreInventoryOpen(false);
    }
  }

  return(
    <div className="bookstore-inventory-total">
      {logo ?
        <img src={logo} className="bookstore-inventory-img"/> :
        <div style={{display: 'flex', marginLeft:'0.5rem', alignItems: "center"}}>
          <FontAwesomeIcon
            icon={type === "book" ? faBookOpen : faStore}
            className="inventory-logo"/>
          <div
            className="inventory-name"
            style={{marginLeft: "0.5rem", marginBottom: "0"}}>{name}</div>
        </div>
      }
      <div>Total vendidos: {initialTotal - currentTotal} / {initialTotal}</div>
      <div>Total disponibles: {currentTotal} / {initialTotal}</div>
      <div className="bookstore-progress-return">
        <ProgressBar current={currentTotal} initial={initialTotal} />
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="inventory-back-button"
          onClick={returnToInventoriesAreaDashboard}/>
      </div>
    </div>
  )
}

export default BookstoreInventoryTotal;
