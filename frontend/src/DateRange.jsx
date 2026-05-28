import { useRef, useEffect } from "react";
import "./DateRange.scss";

function DateRange({
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) {
  const startDateRef = useRef();
  const endDateRef = useRef();

  useEffect(() => {
    if (startDateRef.current && startDate) {
      const parts = startDate.split('-');
      startDateRef.current.valueAsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }, [startDate])

  useEffect(() => {
    if (endDateRef.current && endDate) {
      const parts = endDate.split('-');
      endDateRef.current.valueAsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }, [endDate])

  return(
    <div className="date-range">
      <input
        className="global-input dr-input"
        type="date"
        ref={startDateRef}
        onChange={(e) => setStartDate(e.target.value)}></input>
      <input
        className="global-input dr-input"
        type="date"
        ref={endDateRef}
        onChange={(e) => setEndDate(e.target.value)}></input>
    </div>
  )
}
export default DateRange;
