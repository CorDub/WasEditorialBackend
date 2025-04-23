import "./BooksSoldGraphLine.scss";
import { useEffect, useRef, useState } from "react";

function BooksSoldGraphLine({bookData, max}) {
  const lineRef = useRef();
  const titleRef = useRef();
  const numberRef = useRef();
  const [title, setTitle] = useState(bookData.title)

  function determineLength() {
    // Ensure length is proportional to number of sales, cuts title if necessary
    const lineLength = lineRef.current.getBoundingClientRect().width;
    const titleLength = titleRef.current.getBoundingClientRect().width;
    const numberLength = numberRef.current.getBoundingClientRect().width;

    const percentOfSold = bookData.summary.sold * 100 / max;
    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    determineLength();
  }, [bookData, max])

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title" ref={titleRef}>{title}</div>
      <div className="bsgl-number" ref={numberRef}>{bookData.summary.sold}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
