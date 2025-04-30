function CommissionMonthSelectorRow({month}) {
  return(
    <div className="cms-row">
      <div className="cms-month">{month[0]}</div>
      <div className="cms-status"></div>
      <div className="cms-total">{month[1].total}</div>
    </div>
  )
}

export default CommissionMonthSelectorRow;
