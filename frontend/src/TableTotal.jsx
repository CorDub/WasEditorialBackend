import "./TableTotal.scss";
import formatNumber from "./customHooks/formatNumber";

function TableTotal({headerList, quantity, tienda, total}) {
  return (
    <div className="table-total">
      <div className={`${headerList[0]}`}>Total</div>
      <div className={`${headerList[1]}`}>{quantity}</div>
      <div className={`${headerList[2]}`}>{tienda || 0}</div>
      <div className={`${headerList[3]}`}>$ {formatNumber(total)}</div>
    </div>
  )
}

export default TableTotal;
