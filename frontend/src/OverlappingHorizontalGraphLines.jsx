import "./OverlappingHorizontalGraphLines.scss";
import { useState, useEffect } from "react";

function OverlappingHorizontalGraphLines({title, initial, sold, given, max}) {
  const [displayOrder, setDisplayOrder] = useState({});

  // Getting the index in descending order for our values
  // so that we can map to z-index
  // and make sure the smallest value is displayed on top of the others
  useEffect(() => {
    let displayOrder = {};
    let values = [initial, given, sold];
    values.sort((a, b) => b - a);

    for (const index in values) {
      if (values[index] === initial) {
        displayOrder['initial'] = index;
      };

      if (values[index] === sold) {
        displayOrder['sold'] = index;
      };

      if (values[index] === given) {
        displayOrder['given'] = index;
      };
    }

    setDisplayOrder(displayOrder);
  }, [initial, sold, given])

  function getPercent(number, max) {
    return (number * 100 / max)
  }

  return(
    <div className="overlapping-horizontal-graph-lines">
      <div className="ohgl-title">{title}</div>
      <div className="ohgl-actual-lines">
        <div
          className="ohgl-initial"
          style={{
            width: `${getPercent(initial, max)}%`,
            zIndex:`${displayOrder.initial}`}}>
          {initial}
        </div>
        {sold > 0 && (
          <div
            className="ohgl-sold"
            style={{
              width: `${getPercent(sold, max)}%`,
              zIndex:`${displayOrder.sold}`}}>
            {sold}
          </div>)}
        {given > 0 && (
          <div
            className="ohgl-given"
            style={{
              width: `${getPercent(given, max)}%`,
              zIndex:`${displayOrder.given}`}}>
            {given}
          </div>)}
      </div>
    </div>
  )
}

export default OverlappingHorizontalGraphLines;
