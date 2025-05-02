import "./TableRow.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRow({headerList, name, quantity, ganancia, total}) {

  return(
    <div className="table-row">
      <div className={`${headerList[0]}`}>{name}</div>
      <div className={`${headerList[1]}`}>{quantity}</div>
      <div className={`${headerList[2]}`}>{formatNumber(ganancia)}</div>
      <div className={`${headerList[3]}`}>$ {formatNumber(total)}</div>
    </div>
  )
}

export default TableRow
