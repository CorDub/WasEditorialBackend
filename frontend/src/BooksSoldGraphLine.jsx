import "./BooksSoldGraphLine.scss";
import { useRef } from "react";

function BooksSoldGraphLine({bookData}) {
  const lineRef = useRef();

  // function determineLength() {
  // }

  return(
    <div className="books-sold-graph-line" ref={lineRef}>
      <div className="bsgl-title">{bookData.title}</div>
      <div className="bsgl-number">{bookData.summary.sold}</div>
    </div>
  )
}

export default BooksSoldGraphLine;
