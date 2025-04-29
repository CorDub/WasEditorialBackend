import "./HorizontalGraphLine.scss";
import { useEffect, useRef } from "react";

function HorizontalGraphLine({ max, number, legend }) {
  const lineRef = useRef();

  function determineLength() {
    // Ensure length is proportional to number of sales
    const lineLength = lineRef.current.getBoundingClientRect().width;

    let percentOfSold = 0;
    percentOfSold = number * 100 / max;

    const newLength = lineLength * percentOfSold / 100;
    lineRef.current.style.width = newLength + "px";
  }

  useEffect(() => {
    if (max && number) {
      requestAnimationFrame(() => {
        determineLength();
      });
    }
  }, [max, number]);

  return(
    <div className="horizontal-graph-line" ref={lineRef}>
      <div className="bsgl-title">{legend}</div>
      <div className="bsgl-number">{number}</div>
    </div>
  )
}

export default HorizontalGraphLine;
