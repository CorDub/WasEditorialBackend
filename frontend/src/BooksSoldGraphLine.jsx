import "./BooksSoldGraphLine.scss";
import { useEffect, useRef } from "react";

function BooksSoldGraphLine({bookData, bookstoreData, max}) {
  const lineRef = useRef();

  function determineLength() {
    // Ensure length is proportional to number of sales

    const lineLength = lineRef.current.getBoundingClientRect().width;

    let percentOfSold = 0;
    if (bookData) {
      percentOfSold = bookData.summary.sold * 100 / max;
    } else {
      percentOfSold = bookstoreData.current * 100 / max;
    }

    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    determineLength();
  }, [max])

  useEffect(() => {
    console.log(bookstoreData);
  }, [bookstoreData])

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title">{bookData ? bookData.title : bookstoreData.name}</div>
      <div className="bsgl-number">{bookData ? bookData.summary.sold : bookstoreData.current}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
