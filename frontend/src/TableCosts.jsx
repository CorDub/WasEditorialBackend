import "./TableCosts.scss";
import formatNumber from "./customHooks/formatNumber";
import { useEffect, useState } from "react";

function TableCosts({costs}) {
    const [totalCosts, setTotalCosts] = useState(0)
    
    useEffect(() => {
        let totalCosts = 0;
        costs.map(cost => totalCosts += cost.amount)
        setTotalCosts(totalCosts);
    }, [costs])

    return(
        <div className="table-costs">
            <div className="table-costs-title">Costos adicionales</div>
            <div className="table-costs-amount">{formatNumber(totalCosts)}</div>
        </div>
    )
}

export default TableCosts;