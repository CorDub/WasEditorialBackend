import "./TableWithDrawersHeader.scss";
import DateRange from "./DateRange";
import { useState } from "react";
import { twelveMonthsAgo } from "../../backend/utils";

function TableWithDrawersHeader({
  openModal
}) {
  const [startDate, setStartDate] = useState(new Date(twelveMonthsAgo().setDate(1)));
  const [endDate, setEndDate] = useState(new Date());

  return(
    <div className="twdh">
      <button className="blue-button"
        onClick={() => {openModal("adding")}}>
        Añadir nueva venta
      </button>
      <div className="twdh-filtrar">
        <DateRange 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}/>
        <button className="blue-button">
          Aplicar filtros</button>
      </div>
    </div>
  )
}

export default TableWithDrawersHeader;