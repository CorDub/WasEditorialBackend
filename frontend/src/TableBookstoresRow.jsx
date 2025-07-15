import "./TableBookstoresRow.scss"
import formatNumber from "./customHooks/formatNumber";

function TableBookstoresRow({monthlySalesData}) {

  return(
    <div className="table-row">
      <div className="tbr-name">{monthlySalesData.name}</div>
      <div className="tbr-name">{monthlySalesData.quantity}</div>
      <div className="tbr-name">{formatNumber(monthlySalesData.price.toFixed(2))}</div>
      <div className="tbr-name">{monthlySalesData.comissions.toFixed(2)}</div>
      <div className="tbr-name">{formatNumber(monthlySalesData.ganancia.toFixed(2))}</div>
      <div className="tbr-name tbr-first">{
          formatNumber(monthlySalesData.quantity * monthlySalesData.ganancia)
        }</div>
    </div>
  )
}

export default TableBookstoresRow;