import { useState, useEffect } from "react";
import { isForMonthNextMonth } from "../../backend/utils";

export default function DemandPaymentButton({
  paymentInfo,
  setModalOpen,
  salesByPayments,
  activeMonth,
  forceRender,

}) {
  const [isDemandPaymentPossible, setDemandPaymentPossible] = useState(true);
  const [isDemandPaymentTooltipOpen, setDemandPaymentTooltipPossible] = useState(false);

  // set the status of payment
    useEffect(() => {
      if (paymentInfo != null) {
        if (paymentInfo && paymentInfo.status === "solicited") {
          setDemandPaymentPossible("solicited");
          return;
        } 
        if (paymentInfo && paymentInfo.status === "paid") {
          setDemandPaymentPossible("paid");
          return;
        } 
        if (paymentInfo && paymentInfo.status === "noVentas") {
          setDemandPaymentPossible("noVentas");
          return;
        } 
        if (paymentInfo && paymentInfo.amount < 0) {
          setDemandPaymentPossible("negativeAmount");
          return;
        }
      }
  
      if (salesByPayments && salesByPayments.length > 0 && Number.isInteger(activeMonth)) {
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const currentActiveMonth = year + "-" + month
        if (currentActiveMonth === salesByPayments[activeMonth].forMonth) {
          setDemandPaymentPossible("currentMonth");
          return;
        }
        if ((isForMonthNextMonth(currentActiveMonth, salesByPayments[activeMonth].forMonth)) && now.getDate() < 10) {
          setDemandPaymentPossible("tooEarlyInTheNextMonth");
          return;
        }
        setDemandPaymentPossible("available");
      }
    }, [salesByPayments, activeMonth, paymentInfo, forceRender])

  return (
    <div className="demand-payment-button">
      {isDemandPaymentPossible === "available" && (
        <div className="author-commissions-solicitar-pago"
          onClick={() => setModalOpen(true)}>Solicitar Pago</div>
      )}
      {isDemandPaymentPossible === "currentMonth" && (
        null
      )}
      {isDemandPaymentPossible === "noVentas" && (
        null
      )}
      {isDemandPaymentPossible === "negativeAmount" && (
        null
      )}
      {isDemandPaymentPossible === "tooEarlyInTheNextMonth" && (
        <div className="author-commissions-solicitar-pago-unavailable"
          onMouseEnter={() => setDemandPaymentTooltipPossible(true)}
          onMouseLeave={() => setDemandPaymentTooltipPossible(false)}>Solicitar Pago
          {isDemandPaymentTooltipOpen && (
            <div className="demand-payment-tooltip">El pago se puede solicitar a partir del día 10 del mes siguiente.</div>
          )}
        </div>
      )}
      {isDemandPaymentPossible === "solicited" && (
        <div className="author-commissions-solicitar-pago-unavailable">Pago solicitado</div>
      )}
      {isDemandPaymentPossible === "paid" && (
        <div className="author-commissions-solicitar-pago-paid">Pagado</div>
          )}
    </div>
  )
}