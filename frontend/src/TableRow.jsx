import "./TableRow.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRow({headerList, name, delivered, sold, enTienda, total}) {

  return(
    <div className="table-row">
      <div className={`${headerList[0]}`}>{name}</div>
      <div className={`${headerList[1]}`}>{delivered === 0 ? "" : delivered}</div>
      <div className={`${headerList[2]}`}>{sold === 0 ? "" : sold}</div>
      <div className={`${headerList[3]}`}>{enTienda}</div>
      <div className={`${headerList[4]}`}>{formatNumber(total)}</div>
    </div>
  )
}

export default TableRow
