import { useEffect, useRef } from "react";

function Tooltip({message, x, y}) {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (x === null || y === null) {
      tooltipRef.current.classList.add("hidden");
    } else {
      tooltipRef.current.style.top = `${y - 60}px`;
      tooltipRef.current.style.left = `${x - 45}px`;
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
