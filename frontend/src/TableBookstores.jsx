import { useState, useEffect } from "react";
import TableBookstoresRow from "./TableBookstoresRow";
import formatNumber from "./customHooks/formatNumber";
import "./TableBookstores.scss";
import TableCosts from "./TableCosts";

function TableBookstores({salesByPayments, activeMonth}) {
  const [monthlySalesData, setMonthlySalesData] = useState([])
  const [costs, setCosts] = useState([])
  const [totalCosts, setTotalCosts] = useState(0)

  useEffect(() => {
    if (salesByPayments.length > 0 && Number.isInteger(activeMonth)) {
      setMonthlySalesData(salesByPayments[activeMonth].sales)
      setCosts(salesByPayments[activeMonth].costs)
      
      if (salesByPayments[activeMonth].costs.length > 0) {
        let totalCost = 0;
        for (const cost of salesByPayments[activeMonth].costs) {
          totalCost += cost.amount
        }
        setTotalCosts(totalCosts);
      } else {
        setTotalCosts(0);
      }
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
          <div className="trdh-subtitle">de la librería</div>
        </div>
        <div className="table-bookstore-header-name">Comisión
          <div className="trdh-subtitle">de la librería</div>
        </div>
        <div className="table-bookstore-header-name">Ganancia 
          <div className="trdh-subtitle">por libro</div>
        </div>
        <div className="table-bookstore-header-name">Total</div>
      </div>
      {monthlySalesData 
        && monthlySalesData.length > 0
        && monthlySalesData.map((monthlySalesData, index) => (
        <TableBookstoresRow 
          key={index} 
          monthlySalesData={monthlySalesData} />
      ))}
      {costs && costs.length > 0 &&
        <TableCosts 
          costs={costs} 
          totalCosts={totalCosts}
          setTotalCosts={setTotalCosts}/>}
      {monthlySalesData && monthlySalesData.length > 0 && (
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
          <div className="tbr-name"></div>
          <div className="tbr-name">
            {salesByPayments.length > 0 
            && Number.isInteger(activeMonth) 
            && formatNumber(salesByPayments[activeMonth].totalValue - totalCosts)}
          </div>
        </div>
      )}
      {monthlySalesData.length === 0 && (
        <div className="table-bookstores-no-sales">
          <div className="table-bookstores-no-sales-message">No ventas este mes</div>
        </div>
      )}
    </div>
  )
}

export default TableBookstores