import { useState, useEffect } from "react";
import TableBookstoresRow from "./TableBookstoresRow";
import TableCosts from "./TableCosts";
import TableTotal from "./TableTotal";
import "./TableBookstores.scss";

function TableBookstores({salesByPayments, activeMonth}) {
  const [headerList, setHeaderList] = useState([
    "Canal",
    "Vendidos",
    "Precio de venta",
    "Comisión de la tienda",
    "Ganancia\n(por libro)",
    "Total"
  ])
  const [monthlySalesData, setMonthlySalesData] = useState([])

  useEffect(() => {
    if (salesByPayments.length > 0 && Number.isInteger(activeMonth)) {
      setMonthlySalesData(salesByPayments[activeMonth].sales)
    }
  }, [salesByPayments, activeMonth])

  return(
    <div className="table">
      <div className="table-header">
        <div className="table-bookstore-header-name">Canal</div>
        <div className="table-bookstore-header-name">Vendidos</div>
        <div className="table-bookstore-header-name">Precio de venta</div>
        <div className="table-bookstore-header-name">% de comisión
          <div className="trdh-subtitle">de la tienda</div>
        </div>
        <div className="table-bookstore-header-name">Ganancia 
          <div className="trdh-subtitle">por libro</div>
        </div>
        <div className="table-bookstore-header-name tbhn-first">Total</div>
      </div>
      {monthlySalesData && monthlySalesData.map((monthlySalesData, index) => (
        <TableBookstoresRow 
          key={index} 
          monthlySalesData={monthlySalesData} />
      ))}
    </div>
  )
}

export default TableBookstores