import formatNumber from "./customHooks/formatNumber";
import './TableBookstoresRowDetails.scss';

function TableBookstoresRowDetails({monthlySalesData}) {
  return(
    <div className="table-row-details">
      {monthlySalesData && monthlySalesData.bookstores.map((bookstore, index) => (
        <div key={index} className="table-row-detail">
          <div className="tbr-first tbr-title tbrd-name">{bookstore.name}</div>
          <div className="tbr-name">{bookstore.quantity}</div>
          <div className="tbr-name">{formatNumber(bookstore.price)}</div>
          <div className="tbr-name">{!bookstore.isComissions ? bookstore.deal_percentage+"%" : "-"}</div>
          <div className="tbr-name">{formatNumber(bookstore.comissions)}</div>
          <div className="tbr-name">{formatNumber(bookstore.ganancia)}</div>
          <div className="tbr-name">{formatNumber(bookstore.quantity * bookstore.ganancia)}</div>
        </div>
      ))}
    </div>
  )
}

export default TableBookstoresRowDetails;