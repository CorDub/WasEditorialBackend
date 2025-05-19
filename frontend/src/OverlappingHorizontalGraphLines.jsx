import "./OverlappingHorizontalGraphLines.scss";
import { useState, useEffect, useRef } from "react";

function OverlappingHorizontalGraphLines({title, initial, sold, given, max}) {
  const [displayOrder, setDisplayOrder] = useState({});
  const [isTitleTooltipOpen, setTitleTooltipOpen] = useState(false);
  const titleRef = useRef();
  const [isEllipsed, setEllipsed] = useState(false);

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

  function getPercent(number, name, max) {
    if (name === "sold" && displayOrder[name] === "1") {
      return ((number + given) * 100 / max)
    } else if (name === "given" && displayOrder[name] === "1") {
      return ((number + sold) * 100 / max)
    }
    return (number * 100 / max)
  }

  useEffect(() => {
    console.log(isTitleTooltipOpen)
  }, [isTitleTooltipOpen]);

  // make sure we display a tooltip only if the text is ellipsed
  useEffect(() => {
    requestAnimationFrame(() => {
      if (titleRef.current) {
        if (titleRef.current.scrollWidth > titleRef.current.clientWidth) {
          setEllipsed(true);
        }
      }
    })
  }, []);

  return(
    <div className="ohgl-global">
      <div className="ohgl-title-container"
        onMouseEnter={() => setTitleTooltipOpen(true)}
        onMouseLeave={() => setTitleTooltipOpen(false)}>
        <div className="ohgl-title2"
          ref={titleRef}>
          {title}
        </div>
        {isTitleTooltipOpen && isEllipsed && (
          <div className="ohgl-tooltip-title">{title}</div>
        )}
      </div>
      <div className="overlapping-horizontal-graph-lines">
        {/* <div className="ohgl-title">{title} - {initial}</div> */}

          <div className="ohgl-actual-lines">
          {initial > 0 && (
            <div
              className="ohgl-initial"
              style={{
                width: `${getPercent(initial, "initial", max)}%`,
                zIndex:`${displayOrder.initial}`}}>
              {initial - sold - given}
            </div>
          )}
          {sold > 0 && (
            <div
              className="ohgl-sold"
              style={{
                width: `${getPercent(sold, "sold", max)}%`,
                zIndex:`${displayOrder.sold}`}}>
              {sold}
            </div>)}
          {given > 0 && (
            <div
              className="ohgl-given"
              style={{
                width: `${getPercent(given, "given", max)}%`,
                zIndex:`${displayOrder.given}`}}>
              {given}
            </div>)}
          </div>
      </div>
    </div>
  )
}

export default OverlappingHorizontalGraphLines;
