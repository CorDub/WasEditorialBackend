import "./TableRowDetail.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRowDetail({book, ganancia, quantity}) {

  return(
    <div className="table-row-detail">
      <div className='tbd-data'>
        <div className="tbd-book">{book}</div>
        <div className="tbd-quantity"><p>Vendidos: {quantity}</p></div>
        <div className="tbd-ganancia"><p>Ganancia por libro: {formatNumber(ganancia)}</p></div>
      </div>
      <div className="tbd-total">{formatNumber(ganancia * quantity)}</div>
    </div>
  )
}

export default TableRowDetail;
