import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

function BookstoreInventoryTotal({selectedBookstore, selectedLogo, currentTotal, initialTotal}) {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
      import (`./assets/${selectedBookstore}.png`)
        .then((image) => setLogo(image.default));
  }, [selectedLogo])

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
      <ProgressBar current={currentTotal} initial={initialTotal} />
    </div>
  )
}

export default BookstoreInventoryTotal;
