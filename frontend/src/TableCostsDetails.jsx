import "./TableCostsDetails.scss";
import formatNumber from "./customHooks/formatNumber";

function TableCostsDetails({costs}) {
    return(
        <div className="table-costs-details">
            {costs.map((cost, index) => (
                <div key={index} className="tcd-detail">
                    <div className="tcd-note">{cost.note}</div>
                    <div className="tcd-amount">- {formatNumber(cost.amount)}</div>
                </div>
            ))}
        </div>
    )
}

export default TableCostsDetails;