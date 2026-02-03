import "./TableCostsDetails.scss";
import formatNumber from "./customHooks/formatNumber";
import { changeDateFormat } from "../../backend/utils";

function TableCostsDetails({costs}) {
    return(
        <div className="table-costs-details">
            {costs.map((cost, index) => (
                <div key={index} className="tcd-detail">
                    <div className="tcd-date">{changeDateFormat(cost.date, "fullDate")}</div>
                    <div className="tcd-note">{cost.note}</div>
                    <div className="tcd-amount">- {formatNumber(cost.amount)}</div>
                </div>
            ))}
        </div>
    )
}

export default TableCostsDetails;