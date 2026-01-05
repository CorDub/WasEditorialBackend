import formatNumber from "./customHooks/formatNumber";
import KindleDetails from "./KindleDetails";
import './TableBookstoresRowDetails.scss';
import { useState } from "react";

function TableBookstoresRowDetails({monthlySalesData}) {
  const [isKindleDetailsOpen, toggleKindleDetailsOpen] = useState(false);

  function openKindleDetails(bookstoreName) {
    if (bookstoreName !== "Kindle") {
      return;
    }

    toggleKindleDetailsOpen(!isKindleDetailsOpen);
  }

  return(
    <div className="table-row-details">
      {monthlySalesData && monthlySalesData.bookstores.map((bookstore, index) => (
        <div key={index} 
          className={`
            table-row-detail 
            ${bookstore.name === "Kindle" && "tbrd-kindle"}
            `}
          onClick={() => openKindleDetails(bookstore.name)}>
          <div className="tbrd-above">
            <div className={`
              tbr-first 
              tbr-title 
              tbrd-name 
            `}>{bookstore.name}</div>
            <div className="tbr-name">{bookstore.quantity}</div>
            <div className="tbr-name">
              {bookstore.name === "Kindle" 
                ? "-"
                : formatNumber(bookstore.price)}
            </div>
            {/* <div className="tbr-name">
              {bookstore.name === "Kindle"
                ? "-"
                : !bookstore.isComissions 
                  ? bookstore.deal_percentage+"%" 
                  : "-"}
            </div> */}
            <div className="tbr-name">
              {bookstore.name === "Kindle" 
                ? "-"
                : formatNumber(bookstore.comissions)}
            </div>
            <div className="tbr-name">
              {bookstore.name === "Kindle"
                ? "-"
                : formatNumber(bookstore.ganancia)}
            </div>
            <div className="tbr-name">
              {bookstore.name === "Kindle"
                ? formatNumber(bookstore.regalias)
                : formatNumber(bookstore.quantity * bookstore.ganancia)}
            </div>
          </div>
          {bookstore.name === "Kindle" && (
            <div className="tbrd-below">
              {isKindleDetailsOpen && <KindleDetails bookstore={bookstore}/>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TableBookstoresRowDetails;