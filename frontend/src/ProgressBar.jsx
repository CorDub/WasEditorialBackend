import "./ProgressBar.scss";
import { useRef, useEffect } from "react";

function ProgressBar({current, initial}) {
  const maxBarRef = useRef();
  const currentBarRef = useRef();

  function setCurrentLength() {
    const currentLength = Math.round(maxBarRef.current.getBoundingClientRect().width * current / initial);
    currentBarRef.current.style.width = currentLength + "px";
  }

  useEffect(() => {
    setCurrentLength();
  }, [maxBarRef, current, initial])

  return(
    <div className="progress-bar">
      <div className="progress-bar-max" ref={maxBarRef}>
        <div className="progress-bar-current" ref={currentBarRef}>
          <div className="pb-current-number">{current}</div>
        </div>
        <div className="pb-max-number">{initial}</div>
      </div>
    </div>
  )
}

export default ProgressBar;
