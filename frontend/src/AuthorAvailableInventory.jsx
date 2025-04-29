import "./AuthorAvailableInventory.scss"
import { useEffect, useState } from "react";
import BooksSoldGraphLine from "./BooksSoldGraphLine";
import CustomXAxis from "./CustomXAxis";

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
        <BooksSoldGraphLine
          key={index}
          bookData={book}
          max={max}
          number={book.summary.total} />))}
      <CustomXAxis max={max} />
    </div>
  )
}

export default AuthorAvailableInventory;
