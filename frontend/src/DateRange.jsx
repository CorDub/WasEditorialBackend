import "./DateRange.scss";
import { convertISOString } from "../../backend/utils";

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
        onChange={(e) => setStartDate(new Date(e.target.value))}></input>
      <input
        className="global-input dr-input"
        type="date"
        value={convertISOString(endDate)}
        onChange={(e) => setEndDate(new Date(e.target.value))}></input>
    </div>
  )
}
export default DateRange;