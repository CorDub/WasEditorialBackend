import "./TableCosts.scss";
import formatNumber from "./customHooks/formatNumber";

function TableCosts({costs}) {
    return(
        <div className="table-costs">
            <div className="table-costs-title">Costos adicionales</div>
            <div className="table-costs-amount">$ -</div>
        </div>
    )
}

export default TableCosts;