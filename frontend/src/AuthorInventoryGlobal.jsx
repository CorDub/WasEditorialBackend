import XAxis from "./XAxis";
import { useState, useEffect } from "react";
import "./AuthorInventoryGlobal.scss";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import Legend from "./Legend";

function AuthorInventoryGlobal({bookSales}) {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Inicial', '#E2E2E2'],
  ]

  useEffect(() => {
    setData(bookSales.sort((a, b) => b.summary.initial - a.summary.initial));
  }, [bookSales]);

  useEffect(() => {
    console.log(data);
    if (data !== null && data !== undefined && data.length > 0) {
      setMax(data[0].summary.initial);
    }
  }, [data]);

  return(
    <div className="author-inventory-global">
      <div className="aig-title"><h2>Inventario global</h2></div>
      {data && data.map((book, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={book.title}
          initial={book.summary.initial}
          sold={book.summary.sold}
          given={book.summary.givenToAuthor}
          max={max} />))}
      <XAxis max={max} />
      <Legend values={legendValues}/>
    </div>
  )
}

export default AuthorInventoryGlobal;
