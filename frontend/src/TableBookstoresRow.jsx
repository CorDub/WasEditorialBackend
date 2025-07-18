import "./TableBookstoresRow.scss"
import TableBookstoresRowDetails from "./TableBookstoresRowDetails";
import formatNumber from "./customHooks/formatNumber";
import { useState, useEffect } from "react";

function TableBookstoresRow({monthlySalesData}) {
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  
    // Makes sure the row resets (changes back to white visual state) when changing months
    useEffect(() => {
      setDetailsOpen(true);
    }, [monthlySalesData])

    // console.log(monthlySalesData);

  return(
    <div className={isDetailsOpen 
      ? "enveloppe-table-row envtr-open" 
      : "enveloppe-table-row"}>
      <div className="table-row table-row-sales"
        onClick={() => setDetailsOpen(!isDetailsOpen)}>
        <div className="tbr-first tbr-title ">{monthlySalesData.title}</div>
        <div className="tbr-name">{monthlySalesData.totalTitleQuantity}</div>
        <div className="tbr-name"></div>
        <div className="tbr-name"></div>
        <div className="tbr-name"></div>
        <div className="tbr-name"></div>
        <div className="tbr-name">{formatNumber(monthlySalesData.totalTitleValue)}</div>
      </div>
      {isDetailsOpen && (
        <TableBookstoresRowDetails monthlySalesData={monthlySalesData}/>
      )}
    </div>
  )
}

export default TableBookstoresRow;