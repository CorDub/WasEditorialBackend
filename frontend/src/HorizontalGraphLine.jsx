import "./HorizontalGraphLine.scss";
import { useRef, useState, useEffect } from "react";

function HorizontalGraphLine({ max, number, legend }) {
  // const lineRef = useRef();
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    setPercentage(number *100 /max);
  }, [max, number])

  return(
    <div
      className="horizontal-graph-line"
      style={{ width: `${percentage}%`}}>
      <div className="bsgl-title">{legend}</div>
      <div className="bsgl-number">{number}</div>
    </div>
  )
}

export default HorizontalGraphLine;
