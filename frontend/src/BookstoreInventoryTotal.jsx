import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

function BookstoreInventoryTotal({
    selectedBookstore,
    selectedBookstoreNoSpaces,
    selectedLogo,
    currentTotal,
    initialTotal,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen}) {
  const [logo, setLogo] = useState(null);

  // import only the logo you need based on the name
  useEffect(() => {
      import (`./assets/${selectedBookstoreNoSpaces}.png`)
        .then((image) => setLogo(image.default));
  }, [selectedLogo])

  function returnToInventoriesAreaDashboard() {
    setBookstoreInventoryOpen(false);
  }

  return(
    <div className="bookstore-inventory-total">
      {logo ?
        <img src={logo} className="bookstore-inventory-img"/> :
        <div style={{display: 'flex', marginLeft:'0.5rem', alignItems: "center"}}>
          <FontAwesomeIcon
            icon={faBookOpen}
            className="inventory-logo"/>
          <div
            className="inventory-name"
            style={{marginLeft: "0.5rem", marginBottom: "0"}}>{selectedBookstore}</div>
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
