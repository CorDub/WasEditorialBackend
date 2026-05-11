export default function DemandPaymentButton({
  isDemandPaymentPossible,
  setModalOpen,
}) {

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
      {isDemandPaymentPossible === "solicited" && (
        <div className="author-commissions-solicitar-pago-unavailable">Pago solicitado</div>
      )}
      {isDemandPaymentPossible === "paid" && (
        <div className="author-commissions-solicitar-pago-paid">Pagado</div>
          )}
    </div>
  )
}