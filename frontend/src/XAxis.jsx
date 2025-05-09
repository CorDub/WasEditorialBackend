import { useState, useEffect } from "react";
import "./XAxis.scss";

function XAxis({max}) {
  const [points, setPoints] = useState([]);
  const [percentages, setPercentages] = useState([]);

  // choose the value of points and where they'll be set
  useEffect(() => {
    const multiplicator = 10 ** (max.toString().length - 1)
    const maxAxis = Math.round(max / multiplicator) * multiplicator;
    let points = [0, maxAxis/4, maxAxis/2, maxAxis*0.75, maxAxis, max];

    // calculate where to place based on percentages they represent vs max
    if (points.length > 0) {
      let percentages = [];
      let newPoints = [];

      // Do not keep points out of range (> 100)
      // or that would create a visual interlap (between 90 and 99)
      // Resetting the points as well to make sure points and percentages match
      for (const point of points) {
        if (Math.round(point*100/max) < 90 || Math.round(point*100/max) === 100) {
          percentages.push(Math.round(point*100/max));
          newPoints.push(point)
        }
      }

      setPercentages(percentages);
      setPoints(newPoints);
    }
  }, [max])

  return(
    <div className="x-axis">
      <div className="x-axis-line"></div>
      <div className="x-axis-points">
        {percentages.length > 0 && percentages.map((percent, index) => (
          <div
            key={index}
            className="x-axis-number"
            style={{ left: `${percent}%` }}>

          <div className="x-axis-notch"></div>
          <div>{points[index]}</div>
        </div>
        ))}
      </div>
    </div>
  )
}

export default XAxis;
