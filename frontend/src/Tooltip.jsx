import { useEffect, useRef, useState } from "react";

function Tooltip({message, x, y, userFontSize}) {
  const tooltipRef = useRef(null);
  const [multiplicator, setMultiplicator] = useState(1);

  useEffect(() => {
    setMultiplicator(userFontSize)
  }, [userFontSize])

  useEffect(() => {
    if (x === null || y === null) {
      tooltipRef.current.classList.add("hidden");
    } else {
      tooltipRef.current.style.top = `${y - 40 * multiplicator}px`;
      tooltipRef.current.style.left = `${x - 60 * multiplicator}px`;
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
