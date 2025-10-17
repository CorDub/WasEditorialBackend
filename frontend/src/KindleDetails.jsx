import "./KindleDetails.scss"
import { changeDateFormat } from "../../backend/utils";
import formatNumber from "./customHooks/formatNumber";

function KindleDetails({bookstore}) {
  return(
    <div className="kindle-details">
      <div className="kindle-details-group">
        <div className="kindle-details-group-title">Cantidad eBook</div>
        <div className="kindle-details-group-value">{bookstore.quantityEbook}</div>
      </div>
      <div className="kindle-details-group">
        <div className="kindle-details-group-title">Cantidad PoD</div>
        <div className="kindle-details-group-value">{bookstore.quantityPod}</div>
      </div>
      <div className="kindle-details-group">
        <div className="kindle-details-group-title">Fecha de corte</div>
        <div className="kindle-details-group-value">{bookstore && 
          changeDateFormat(bookstore.dateCut, "fullMonths")}
        </div>
      </div>
      <div className="kindle-details-group">
        <div className="kindle-details-group-title">Fecha de pago</div>
        <div className="kindle-details-group-value">{bookstore && 
          changeDateFormat(bookstore.datePay, "fullMonths")}
        </div>
      </div>
      <div className="kindle-details-group">
        <div className="kindle-details-group-title">Regalias</div>
        <div className="kindle-details-group-value">{formatNumber(bookstore.regalias)}</div>
      </div>
    </div>
  )
}

export default KindleDetails;