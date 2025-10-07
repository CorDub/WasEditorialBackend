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
        value={startDate.toLocaleDateString('en-CA')}
        onChange={(e) => setStartDate(new Date(e.target.value))}></input>
      <input
        className="global-input dr-input"
        type="date"
        value={endDate.toLocaleDateString('en-CA')}
        onChange={(e) => setEndDate(new Date(e.target.value))}></input>
    </div>
  )
}
export default DateRange;