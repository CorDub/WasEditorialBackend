import { useState, useEffect } from "react";
import "./TableRow.scss";

function TableRow({headerList, name, quantity, tienda, total, last}) {

  return(
    <div className={ last ? "table-row-last" : "table-row"}>
      <div className={`${headerList[0]}`}>{name}</div>
      <div className={`${headerList[1]}`}>{quantity}</div>
      <div className={`${headerList[2]}`}>{tienda || 0}</div>
      <div className={`${headerList[3]}`}>$ {total.toLocaleString()}</div>
    </div>
  )
}

export default TableRow
