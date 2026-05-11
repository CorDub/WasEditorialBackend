import { changeDateFormat } from "../../backend/utils";
import "./MonthSelector.scss";

function MonthSelector({
  monthsInRange,
  activeMonth,
  setActiveMonth
}) {

  return(
    <div className="commission-month-selector ms-environs">
      <div className="cms-title ms-title">
        <h2>Mes</h2>
      </div>
      {monthsInRange && monthsInRange.map((month, index) => (
        <div key={index}
          className={`
            ${activeMonth === month ? "cms-row-active" : "cms-row"}
          `}
          onClick={() => setActiveMonth(month)}
          >{changeDateFormat(month)}</div>
      ))}
    </div>
  )
}

export default MonthSelector;