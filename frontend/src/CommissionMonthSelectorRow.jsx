import formatNumber from "./customHooks/formatNumber";
import "./CommissionMonthSelectorRow.scss"
import { useState } from "react";
import { useEffect } from "react";

function CommissionMonthSelectorRow({
  index,
  month,
  active,
  setActiveMonth,
  preferredFontSize,
  setPaymentInfo}) {
  const [salesPresence, setSalesPresence] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState("")

  useEffect(() => {
    if (month.amount === 0) {
      setSalesPresence(false)
    }

    if (month.status === "created") {
      setPaymentStatus("No pagado")
    } else if (month.status === "solicited") {
      setPaymentStatus("Solicitado") 
    } else if (month.status === "paid") {
      setPaymentStatus("Pagado")
    } else {
      setPaymentStatus("");
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

  function addPaymentInfo() {
    if (month) {
      setPaymentInfo({
        "month": changeDateFormat(month.forMonth),
        "monthOriginal" : month.forMonth,
        "amount": month.amount,
        "status": month.amount === 0 ? "noVentas" : month.status
      })
    }
  }

  return(
    <div
      className={active ? "cms-row-active" : "cms-row"}
      style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}
      onClick={() => {
        setActiveMonth(index);
        addPaymentInfo();}}>
      <div className="cms-month">{changeDateFormat(month.forMonth)}</div>
      {salesPresence && (
        <div className="cms-status"
          style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}>
          {paymentStatus}
        </div>
      )}
      {!salesPresence && (
        <div className="cms-status-no-sales"
          style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}>
          No ventas
        </div>
      )}
      <div className="cms-total"
        style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}>
          {formatNumber(month.amount)}
      </div>
    </div>
  )
}

export default CommissionMonthSelectorRow;
