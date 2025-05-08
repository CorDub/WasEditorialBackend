import TableRowDetail from "./TableRowDetail";
import "./TableRowDetails.scss";

function TableRowDetails({sales}) {

  return(
    <div className="table-row-details">
      {sales && sales.map((sale, index) => (
        <TableRowDetail
          key={index}
          book={sale.book}
          ganancia={sale.ganancia}
          quantity={sale.quantity} />
      ))}
    </div>
  )
}

export default TableRowDetails;
