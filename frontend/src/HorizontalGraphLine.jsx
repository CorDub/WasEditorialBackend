import "./HorizontalGraphLine.scss";
import { useState, useEffect } from "react";

function HorizontalGraphLine({ max, number, legend, color }) {
  const [percentage, setPercentage] = useState(0);
  const [luminance, setLuminance] = useState(0);

  useEffect(() => {
    setPercentage(number *100 /max);
  }, [max, number])

  function determineLuminance() {
    if (!color) {
      return;
    };

    const r = parseInt(color.substring(1,3),16);
    const g = parseInt(color.substring(3,5),16);
    const b = parseInt(color.substring(5,7),16);

    const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    setLuminance(luminance);
  }

  useEffect(() => {
    determineLuminance();
  }, [color]);

  return(
    <div
      className="horizontal-graph-line"
      style={{
        width: `${percentage}%`,
        backgroundColor: `${color}`,
        color:
          luminance > 0.5
          ? 'black'
          : 'white'
          }}>
      <div className="bsgl-title">{legend}</div>
      <div className="bsgl-number">{number}</div>
    </div>
  )
}

export default HorizontalGraphLine;
