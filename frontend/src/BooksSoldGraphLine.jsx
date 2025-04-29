import "./BooksSoldGraphLine.scss";
import { useEffect, useRef, useState } from "react";

function BooksSoldGraphLine({bookData, bookstoreData, max, number}) {
  const lineRef = useRef();
  const [numberValue, setNumberValue] = useState(0);

  function determineLength() {
    // Ensure length is proportional to number of sales

    const lineLength = lineRef.current.getBoundingClientRect().width;

    let percentOfSold = 0;
    percentOfSold = numberValue * 100 / max;
    console.log(percentOfSold);

    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    console.log(number);

    if (number) {
      setNumberValue(number);
      return;
    };

    if (bookData) {
      if (bookData.summary) {
        setNumberValue(bookData.summary.sold);
      } else {
        setNumberValue(bookData.current);
      }
    } else {
      setNumberValue(bookstoreData.current);
    };
  }, [])

  useEffect(() => {
    if (max && numberValue) {
      requestAnimationFrame(() => {
        determineLength();
      });
    }
  }, [max, numberValue]);

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title">{bookData ? bookData.title : bookstoreData.name}</div>
      <div className="bsgl-number">{numberValue && numberValue}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
