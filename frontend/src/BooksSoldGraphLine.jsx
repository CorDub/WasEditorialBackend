import "./BooksSoldGraphLine.scss";
import { useEffect, useRef } from "react";

function BooksSoldGraphLine({bookData, max}) {
  const lineRef = useRef();

  function determineLength() {
    // Ensure length is proportional to number of sales
    const parentWidth = lineRef.current.parentElement.getBoundingClientRect().width;
    const style = window.getComputedStyle(lineRef.current);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const marginLeft = parseFloat(style.marginLeft);
    const marginRight = parseFloat(style.marginRight);
    const availableWidth = parentWidth - (paddingLeft + paddingRight + marginLeft + marginRight);
    console.log(availableWidth);

    const lineLength = lineRef.current.getBoundingClientRect().width;
    console.log(lineLength);

    const percentOfSold = bookData.summary.sold * 100 / max;
    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    determineLength();
  }, [bookData.summary.sold, max])

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title">{bookData.title}</div>
      <div className="bsgl-number">{bookData.summary.sold}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
