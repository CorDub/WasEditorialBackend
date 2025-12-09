import "./DateRange.scss";
import { convertISOString, avoidTimeshift } from "../../backend/utils";

function DateRange({
  startDate,
  setStartDate,
  endDate, 
  setEndDate
}) {

  return(
    <div className="date-range">
      <input
        className="global-input dr-input"
        type="date"
        value={convertISOString(startDate)}
        onChange={(e) => setStartDate(avoidTimeshift(e.target.value))}></input>
      <input
        className="global-input dr-input"
        type="date"
        value={convertISOString(endDate)}
        onChange={(e) => setEndDate(avoidTimeshift(e.target.value))}></input>
    </div>
  )
}
export default DateRange;