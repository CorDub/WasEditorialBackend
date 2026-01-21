import "./DateRange.scss";
import { useEffect } from "react";
import { convertISOString, avoidTimeshift, toLocalISODate } from "../../backend/utils";

function DateRange({
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) {

  // useEffect(() => {
  //   console.log("end date", endDate)
  //   console.log(typeof endDate)
  //   console.log("isodlocal", toLocalISODate(endDate))
  // }, [endDate])

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
