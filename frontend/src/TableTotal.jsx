import "./TableTotal.scss";
import formatNumber from "./customHooks/formatNumber";

function TableTotal({headerList, delivered, sold, enTienda, total}) {
  return (
    <div className="table-total">
      <div className={`${headerList[0]}`}>Total</div>
      <div className={`${headerList[1]}`}>{delivered}</div>
      <div className={`${headerList[2]}`}>{sold}</div>
      <div className={`${headerList[3]}`}>{enTienda}</div>
      <div className={`${headerList[4]}`}>{formatNumber(total)}</div>
    </div>
  )
}

export default TableTotal;
