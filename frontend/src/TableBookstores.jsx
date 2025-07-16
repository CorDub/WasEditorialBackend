import { useState, useEffect } from "react";
import TableBookstoresRow from "./TableBookstoresRow";
import formatNumber from "./customHooks/formatNumber";
import TableCosts from "./TableCosts";
import TableTotal from "./TableTotal";
import "./TableBookstores.scss";

function TableBookstores({salesByPayments, activeMonth}) {
  const [monthlySalesData, setMonthlySalesData] = useState([])

  useEffect(() => {
    if (salesByPayments.length > 0 && Number.isInteger(activeMonth)) {
      setMonthlySalesData(salesByPayments[activeMonth].sales)
    }
  }, [salesByPayments, activeMonth])

  console.log(salesByPayments)

  return(
    <div className="table">
      <div className="table-header">
        <div className="table-bookstore-header-name tbhn-first">Libro</div>
        <div className="table-bookstore-header-name">Vendidos</div>
        <div className="table-bookstore-header-name">Precio de venta</div>
        <div className="table-bookstore-header-name">% de comisión
          <div className="trdh-subtitle">de la tienda</div>
        </div>
        <div className="table-bookstore-header-name">Ganancia 
          <div className="trdh-subtitle">por libro</div>
        </div>
        <div className="table-bookstore-header-name">Total</div>
      </div>
      {monthlySalesData && monthlySalesData.map((monthlySalesData, index) => (
        <TableBookstoresRow 
          key={index} 
          monthlySalesData={monthlySalesData} />
      ))}
      <div className="table-total">
        <div className="tbr-first tbr-title">Total</div>
        <div className="tbr-name">
          {salesByPayments.length > 0 
          && Number.isInteger(activeMonth) 
          && salesByPayments[activeMonth].totalQuantity}
        </div>
        <div className="tbr-name"></div>
        <div className="tbr-name"></div>
        <div className="tbr-name"></div>
        <div className="tbr-name">
          {salesByPayments.length > 0 
          && Number.isInteger(activeMonth) 
          && formatNumber(salesByPayments[activeMonth].totalValue)}
        </div>
      </div>
    </div>
  )
}

export default TableBookstores