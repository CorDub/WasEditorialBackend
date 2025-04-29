import "./BooksSoldGraph.scss";
import { useState, useEffect } from "react";
import XAxis from "./XAxis";
import HorizontalGraphLine from "./HorizontalGraphLine";

function BooksSoldGraph({bookSales}) {
  const [booksListBySales, setBooksListBySales] = useState([]);
  const [max, setMax] = useState(0);

  function sortBooksBySales() {
    let sorted = [...bookSales];
    sorted.sort((a,b) => b.summary.sold - a.summary.sold);
    setBooksListBySales(sorted);
  }

  useEffect(() => {
    sortBooksBySales();
  }, [bookSales])

  //Make sure booksListBySales[0] exists before passing it to CustomXAxis
  useEffect(() => {
    if (booksListBySales.length > 0) {
      setMax(booksListBySales[0].summary.sold)
    }
  }, [booksListBySales])

  return(
    <div className="books-sold-graph">
      {booksListBySales && (
        <>
          {booksListBySales.map((book, index) => (
            <HorizontalGraphLine
              key={index}
              max={max}
              number={book.summary.sold}
              legend={book.title}/>))}
          <XAxis max={max}/>
        </>)}
    </div>
  )
}

export default BooksSoldGraph;
