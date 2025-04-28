import "./BooksSoldGraphLine.scss";
import { useEffect, useRef, useState } from "react";

function BooksSoldGraphLine({bookData, bookstoreData, max}) {
  const lineRef = useRef();
  const [number, setNumber] = useState(0);

  function determineLength() {
    // Ensure length is proportional to number of sales

    const lineLength = lineRef.current.getBoundingClientRect().width;
    console.log(lineLength);

    let percentOfSold = 0;
    percentOfSold = number * 100 / max;

    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    if (bookData) {
      if (bookData.summary) {
        setNumber(bookData.summary.sold);
      } else {
        setNumber(bookData.current);
      }
    } else {
      setNumber(bookstoreData.current);
    };
  }, [])

  useEffect(() => {
    if (max && number) {
      requestAnimationFrame(() => {
        determineLength();
      });
    }
  }, [max, number]);

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title">{bookData ? bookData.title : bookstoreData.name}</div>
      <div className="bsgl-number">{number && number}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
