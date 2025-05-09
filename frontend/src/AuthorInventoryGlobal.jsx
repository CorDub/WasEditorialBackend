import HorizontalGraphLine from "./HorizontalGraphLine";
import XAxis from "./XAxis";
import { useState, useEffect } from "react";
import "./AuthorInventoryGlobal.scss";
import ProgressBar from "./ProgressBar";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";

function AuthorInventoryGlobal({bookSales}) {
  const [data, setData] = useState(null);
  const [max, setMax] = useState(0);

  useEffect(() => {
    setData(bookSales.sort((a, b) => b.summary.sold - a.summary.sold));
  }, [bookSales]);

  useEffect(() => {
    console.log(data);
    if (data !== null && data !== undefined && data.length > 0) {
      setMax(data[0].summary.initial);
    }
  }, [data]);

  return(
    <div className="author-inventory-global">
      {data && data.map((book, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          initial={book.summary.initial}
          sold={book.summary.sold}
          given={book.summary.givenToAuthor} />))}
        <XAxis max={max} />
    </div>
  )
}

export default AuthorInventoryGlobal;
