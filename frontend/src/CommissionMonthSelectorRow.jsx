import formatNumber from "./customHooks/formatNumber";
import "./CommissionMonthSelectorRow.scss"
import { useState } from "react";
import { useEffect } from "react";

function CommissionMonthSelectorRow({index, month, active, setActiveMonth}) {
  const [salesPresence, setSalesPresence] = useState(true)

  useEffect(() => {
    if (month.amount === 0) {
      setSalesPresence(false)
    }
  }, [month])

  function changeDateFormat(date) {
    const months = {
      "01": "Ene",
      "02": "Feb",
      "03": "Mar",
      "04": "Abr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Ago",
      "09": "Sep",
      "10": "Oct",
      "11": "Nov",
      "12": "Dic"
    }

    return months[date.substring(5,7)] + " " + date.substring(0,4);
  }

  return(
    <div
      className={active ? "cms-row-active" : "cms-row"}
      onClick={() => setActiveMonth(index)}>
      <div className="cms-month">{changeDateFormat(month.forMonth)}</div>
      {salesPresence && (
        <div className="cms-status">
          {month.isPaid ? "Pagado" : "No pagado"}
        </div>
      )}
      {!salesPresence && (
        <div className="cms-status-no-sales">
          No ventas
        </div>
      )}
      <div className="cms-total">{formatNumber(month.amount)}</div>
    </div>
  )
}

export default CommissionMonthSelectorRow;
