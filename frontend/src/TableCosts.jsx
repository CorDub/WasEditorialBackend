import "./TableCosts.scss";
import formatNumber from "./customHooks/formatNumber";
import { useEffect, useState } from "react";
import TableCostsDetails from "./TableCostsDetails";

function TableCosts({costs}) {
    const [totalCosts, setTotalCosts] = useState(0);
    const [isTotalCostsDetailsOpen, setTotalCostsDetailsOpen] = useState(false);
    
    useEffect(() => {
        let totalCosts = 0;
        costs.map(cost => totalCosts += cost.amount);
        setTotalCosts(totalCosts);
    }, [costs])

    return(
        <div className="table-costs"
            onClick={() => setTotalCostsDetailsOpen(!isTotalCostsDetailsOpen)}>
            <div className="table-costs-line">
                <div className="table-costs-title">Costos adicionales</div>
                <div className="table-costs-amount">- {formatNumber(totalCosts)}</div>
            </div>
            {isTotalCostsDetailsOpen && 
                <TableCostsDetails costs={costs}/>}
        </div>
    )
}

export default TableCosts;