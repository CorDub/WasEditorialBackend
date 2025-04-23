import { useState, useEffect, useRef } from "react";
import "./CustomXAxis.scss";

function CustomXAxis({max}) {
  const [points, setPoints] = useState([]);
  const [totalLength, setTotalLength] = useState(0);
  const lineRef = useRef();
  const pointRefs = useRef([]);

  useEffect(() => {
    const multiplicator = 10 ** (max.toString().length - 1)
    const maxAxis = Math.floor(max / multiplicator) * multiplicator;
    setPoints([0, maxAxis/4, maxAxis/2, maxAxis*0.75, maxAxis, max])
  }, [max])

  function placePoint(pointValue, ref) {
    const position = totalLength * (pointValue * 100 / max) / 100;
    const halfPointLength = ref.getBoundingClientRect().width / 2;
    ref.style.left = position - halfPointLength + "px";
  }

  useEffect(() => {
    setTotalLength(lineRef.current.getBoundingClientRect().width);
  }, [])

  useEffect(() => {
    for (let i = 0; i < points.length; i++) {
      placePoint(points[i], pointRefs.current[i]);
    }
  }, [points])

  return(
    <div className="custom-x-axis">
      <div className="custom-x-axis-line" ref={lineRef}></div>
      <div className="x-axis-points">
        <div className="x-axis-number" ref={(el) => (pointRefs.current[0] = el)}>{points[0]}</div>
        <div className="x-axis-number" ref={(el) => (pointRefs.current[1] = el)}>{points[1]}</div>
        <div className="x-axis-number" ref={(el) => (pointRefs.current[2] = el)}>{points[2]}</div>
        <div className="x-axis-number" ref={(el) => (pointRefs.current[3] = el)}>{points[3]}</div>
        <div className="x-axis-number" ref={(el) => (pointRefs.current[4] = el)}>{points[4]}</div>
        <div className="x-axis-number" ref={(el) => (pointRefs.current[5] = el)}>{points[5]}</div>
      </div>
    </div>
  )
}

export default CustomXAxis;
