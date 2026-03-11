import "./DateRange.scss";

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
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}></input>
      <input
        className="global-input dr-input"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}></input>
    </div>
  )
}
export default DateRange;
