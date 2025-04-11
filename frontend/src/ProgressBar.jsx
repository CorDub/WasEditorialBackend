import "./ProgressBar.scss";
import { useRef, useEffect, useState } from "react";

function ProgressBar({current, initial, returns}) {
  const maxBarRef = useRef();
  const currentBarRef = useRef();
  const returnsBarRef = useRef();
  const [hideMaxNumber, setHideMaxNumber] = useState(false);

  function setCurrentLength() {
    const currentLength = Math.round(maxBarRef.current.getBoundingClientRect().width * (initial-current-returns) / initial);
    currentBarRef.current.style.width = currentLength + 5 + "px";
  }

  function setReturnsBarLength() {
    const currentBarRight = currentBarRef.current.getBoundingClientRect().right;
    const maxBarLeft = maxBarRef.current.getBoundingClientRect().left;
    const actualStart = currentBarRight - maxBarLeft;
    const returnsBarLength = maxBarRef.current.getBoundingClientRect().width * (returns / initial);
    returnsBarRef.current.style.left = actualStart + "px";
    returnsBarRef.current.style.width = returnsBarLength + "px";

    const maxBarRight = maxBarRef.current.getBoundingClientRect().right;
    const returnsBarRight = returnsBarRef.current.getBoundingClientRect().right;
    if (maxBarRight - returnsBarRight < 20) {
      setHideMaxNumber(true);
    }
  }

  useEffect(() => {
    setCurrentLength();
    if (returns > 0) {
      setReturnsBarLength();
    }
  }, [maxBarRef, currentBarRef, returnsBarRef, current, initial, returns])

  return(
    <div className="progress-bar">
      <div className="progress-bar-max" ref={maxBarRef}>
        <div className="progress-bar-current" ref={currentBarRef}>
          <div className="pb-current-number">{initial - current - returns}</div>
        </div>
        {returns > 0 && (
          <div className="progress-bar-returns" ref={returnsBarRef}>
            <div className='pb-returns-number'>{returns}</div>
          </div>
        )}
        {!hideMaxNumber && (
          <div className="pb-max-number">{current}</div>
        )}
      </div>
    </div>
  )
}

export default ProgressBar;
