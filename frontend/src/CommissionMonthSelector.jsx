import CommissionMonthSelectorRow from "./CommissionMonthSelectorRow";
import "./CommissionMonthSelector.scss";

function CommissionMonthSelector({activeMonth, setActiveMonth, payments}) {

  return(
    <div className="commission-month-selector">
      <div className="cms-title"><h2>Selecciona mes</h2></div>
      {payments && payments.map((month, index) => (
        <CommissionMonthSelectorRow
          key={index}
          index={index}
          month={month}
          active={index === activeMonth ? true : false}
          setActiveMonth={setActiveMonth}/>
      ))}

    </div>
  )
}

export default CommissionMonthSelector
