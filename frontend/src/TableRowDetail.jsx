import "./TableRowDetail.scss";
import formatNumber from "./customHooks/formatNumber";

function TableRowDetail({book, price, comissions, ganancia, sharePerAuthor, quantity}) {

  return(
    <div className="table-row-detail">
      <div className='tbd-data'>
        <div className="tbd-book">{book}</div>
        <div className="tbd-quantity"><p>{quantity}</p></div>
        <div className="tbd-price">{formatNumber(price)}</div>
        <div className="tbd-comissions">{formatNumber(comissions)}</div>
        <div className="tbd-share">{sharePerAuthor}</div>
        <div className="tbd-ganancia"><p>{formatNumber(ganancia)}</p></div>
        <div className="tbd-total">{formatNumber(ganancia * quantity)}</div>
      </div>
    </div>
  )
}

export default TableRowDetail;
