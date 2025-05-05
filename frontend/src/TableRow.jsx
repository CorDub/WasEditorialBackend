import "./TableRow.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRow({headerList, name, delivered, sold, total}) {

  return(
    <div className="table-row">
      <div className={`${headerList[0]}`}>{name}</div>
      <div className={`${headerList[1]}`}>{delivered}</div>
      <div className={`${headerList[2]}`}>{sold}</div>
      <div className={`${headerList[3]}`}></div>
      <div className={`${headerList[4]}`}>{formatNumber(total)}</div>
    </div>
  )
}

export default TableRow
