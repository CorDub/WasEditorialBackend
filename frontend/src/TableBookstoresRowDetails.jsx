import formatNumber from "./customHooks/formatNumber";
import './TableBookstoresRowDetails.scss';
import TableBookstoresRowKindleDetails from "./TableBookstoresRowKindleDetails";

function TableBookstoresRowDetails({monthlySalesData}) {

  return(
    <div className="table-row-details">
      {monthlySalesData && monthlySalesData.bookstores.map((bookstore, index) => (
        <>
          {bookstore.name === "Kindle" ? (
            <TableBookstoresRowKindleDetails 
              key={index} 
              bookstore={bookstore}/>
            )
            :
            (
              <div key={index} 
              className='table-row-detail'>
                <div className="tbrd-above">
                  <div className={`
                    tbr-first 
                    tbr-title 
                    tbrd-name 
                  `}>{bookstore.name}</div>
                  <div className="tbr-name">{bookstore.quantity}</div>
                  <div className="tbr-name">
                    {formatNumber(bookstore.price)}
                  </div>
                  <div className="tbr-name">
                    {formatNumber(bookstore.comissions)}
                  </div>
                  <div className="tbr-name">
                    {formatNumber(bookstore.ganancia)}
                  </div>
                  <div className="tbr-name">
                    {formatNumber(Math.round(bookstore.quantity * (bookstore.ganancia * 100)) / 100)}
                  </div>
                </div>
              </div>
            )
          }
        </>
      ))}
    </div>
  )
}

export default TableBookstoresRowDetails;