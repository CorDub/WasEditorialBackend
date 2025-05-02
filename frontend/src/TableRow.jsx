import "./TableRow.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRow({headerList, name, quantity, tienda, total}) {

  return(
    <div className="table-row">
      <div className={`${headerList[0]}`}>{name}</div>
      <div className={`${headerList[1]}`}>{quantity}</div>
      <div className={`${headerList[2]}`}>{tienda || 0}</div>
      <div className={`${headerList[3]}`}>$ {formatNumber(total)}</div>
    </div>
  )
}

export default TableRow
