import CommissionMonthSelectorRow from "./CommissionMonthSelectorRow";
import "./CommissionMonthSelector.scss";
import LoadingWheel from "./LoadingWheel";

function CommissionMonthSelector({
  activeMonth,
  setActiveMonth,
  payments,
  preferredFontSize,
  setPaymentInfo}) {

  return(
    <div className="commission-month-selector">
      <div className="cms-title"><h2>Selecciona mes</h2></div>
      {!payments && <LoadingWheel />}
      {payments && payments.map((month, index) => (
        <CommissionMonthSelectorRow
          key={index}
          index={index}
          month={month}
          active={index === activeMonth ? true : false}
          setActiveMonth={setActiveMonth}
          preferredFontSize={preferredFontSize}
          setPaymentInfo={setPaymentInfo}/>
      ))}

    </div>
  )
}

export default CommissionMonthSelector
