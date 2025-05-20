import "./OverlappingHorizontalGraphLines.scss";
import { useState, useEffect, useRef } from "react";

function OverlappingHorizontalGraphLines({title, initial, sold, given, current, returns, max}) {
  const [isTitleTooltipOpen, setTitleTooltipOpen] = useState(false);
  const titleRef = useRef();
  const [isEllipsed, setEllipsed] = useState(false);
  const [newLengths, setNewLengths] = useState({
    current: 0,
    returns: 0,
    sold: 0,
    given: 0
  })

  function getLength(type, max) {
    switch (type) {
      case current:
        return ((current + sold + returns + given) * 100) / max
      case returns:
        return ((given + sold + returns) * 100) / max
      case sold:
        return ((given + sold) * 100) / max
      case given:
        return (given * 100) / max
    }
  }

  // make sure we display a tooltip only if the text is ellipsed
  useEffect(() => {
    requestAnimationFrame(() => {
      if (titleRef.current) {
        if (titleRef.current.scrollWidth > titleRef.current.clientWidth) {
          setEllipsed(true);
        }
      }

      const newLengths = {
        current: getLength(current, max),
        returns: getLength(returns, max),
        sold: getLength(sold, max),
        given: getLength(given, max)
      }
      setNewLengths(newLengths);
    })
  }, [max]);

  console.log(newLengths);

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
          <div className="ohgl-actual-lines">
          {current > 0 && (
            <div
              className="ohgl-current"
              style={{width: `${newLengths.current}%`}}>
              {current}
            </div>
          )}
          {sold > 0 && (
            <div
              className="ohgl-sold"
              style={{width: `${newLengths.sold}%`}}>
              {sold}
            </div>)}
          {given > 0 && (
            <div
              className="ohgl-given"
              style={{width: `${newLengths.given}%`}}>
              {given}
            </div>)}
          {returns > 0 && (
            <div
              className="ohgl-returns"
              style={{width: `${newLengths.returns}%`}}>
              {returns}
            </div>)}
          </div>
      </div>
    </div>
  )
}

export default OverlappingHorizontalGraphLines;
