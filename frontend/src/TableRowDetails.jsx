import { useEffect, useState } from "react";
import TableRowDetail from "./TableRowDetail";
import "./TableRowDetails.scss";

function TableRowDetails({sales}) {

  return(
    <div className="table-row-details">
      {sales && sales.map((sale, index) => (
        <TableRowDetail
          key={index}
          book={sale.book}
          price={sale.price}
          comissions={sale.comissions}
          ganancia={(sale.price - sale.comissions) * parseFloat(sale.sharePerAuthor) / 100}
          sharePerAuthor={sale.sharePerAuthor}
          quantity={sale.quantity} />
      ))}
    </div>
  )
}

export default TableRowDetails;
