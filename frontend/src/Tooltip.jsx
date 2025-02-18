import { useEffect, useRef } from "react";

function Tooltip({message, x, y}) {
  const tooltipRef = useRef(null);

  // function toggleTooltip(tooltipRef, tooltipedElementId) {
  //   if (tooltipRef.current.classList.contains("hidden")) {
  //     const tooltipedElement = document.getElementById(tooltipedElementId);
  //     const rect = tooltipedElement.getBoundingClientRect();
  //     tooltipRef.current.style.top = `${rect.top - 80}px`
  //     tooltipRef.current.classList.remove("hidden");
  //   } else {
  //     tooltipRef.current.classList.add("hidden");
  //   }
  // };

  useEffect(() => {
    if (x === null || y === null) {
      tooltipRef.current.classList.add("hidden");
    } else {
      tooltipRef.current.style.top = `${y - 80}px`;
      tooltipRef.current.classList.remove("hidden");
    }

  }, [x, y])

  return(
    <div className="tooltip-proper hidden" ref={tooltipRef}>
      <p className="tooltip-message">{message}</p>
    </div>
  )
}

export default Tooltip;
