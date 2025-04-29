import "./AuthorAvailableInventory.scss"
import { useEffect, useState } from "react";
import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";

function AuthorAvailableInventory({bookSales}) {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);

  useEffect(() => {
    setData(bookSales.sort((a, b) => b.summary.total - a.summary.total));
  }, [bookSales]);

  useEffect(() => {
    if (data) {
      setMax(data[0].summary.total);
    }
  }, [data]);

  return (
    <div className="author-available-inventory">
      {data && data.map((book, index) =>(
        <HorizontalGraphLine
          key={index}
          max={max}
          number={book.summary.total}
          legend={book.title} />))}
      <XAxis max={max} />
    </div>
  )
}

export default AuthorAvailableInventory;
