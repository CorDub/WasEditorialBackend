import TableRowDetail from "./TableRowDetail";
import "./TableRowDetails.scss";

function TableRowDetails({sales}) {

  console.log(sales);

  return(
    <div className="table-row-details">
      {sales && sales.map((sale, index) => (
        <TableRowDetail
          key={index}
          book={sale.book}
          price={sale.price}
          comissions={sale.comissions}
          ganancia={sale.ganancia}
          sharePerAuthor={sale.sharePerAuthor}
          quantity={sale.quantity} />
      ))}
    </div>
  )
}

export default TableRowDetails;
