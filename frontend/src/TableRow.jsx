import "./TableRow.scss";
import formatNumber from "./customHooks/formatNumber";
import { useState } from "react";
import TableRowDetails from "./TableRowDetails";

function TableRow({headerList, name, delivered, sold, sales, enTienda, total}) {
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className={isDetailsOpen ? "enveloppe-table-row envtr-open" : "enveloppe-table-row"}>
      <div className={ sold ? "table-row table-row-sales" : "table-row" }
        onClick={sold ? () => setDetailsOpen(!isDetailsOpen) : undefined}>
        <div className={`${headerList[0]}`}>{name}</div>
        <div className={`${headerList[1]}`}>{delivered === 0 ? "" : delivered}</div>
        <div className={`${headerList[2]}`}>{sold === 0 ? "" : sold}</div>
        <div className={`${headerList[3]}`}>{enTienda}</div>
        <div className={`${headerList[4]}`}>{formatNumber(total)}</div>
      </div>
      {isDetailsOpen &&
        <TableRowDetails sales={sales}/>}
    </div>
  )
}

export default TableRow
