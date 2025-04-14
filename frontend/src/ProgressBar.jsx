import "./ProgressBar.scss";
import { useRef, useEffect, useState } from "react";

function ProgressBar({current, initial, returns}) {
  const maxBarRef = useRef();
  const currentBarRef = useRef();
  const returnsBarRef = useRef();
  const returnsNumberRef = useRef();
  const [hideMaxNumber, setHideMaxNumber] = useState(false);
  // const [returnsBarLength, setReturnsBarLength] = useState(0);

  function setCurrentLength() {
    const currentLength = Math.round(maxBarRef.current.getBoundingClientRect().width * (initial-current) / initial);
    currentBarRef.current.style.width = currentLength + 5 + "px";
  }

  function determineReturnsBarLength() {
    const currentBarRight = currentBarRef.current.getBoundingClientRect().right;
    const maxBarLeft = maxBarRef.current.getBoundingClientRect().left;
    const actualStart = currentBarRight - maxBarLeft;
    const returnsBarLength = maxBarRef.current.getBoundingClientRect().width * (returns / initial);
    returnsBarRef.current.style.left = actualStart - 5 + "px";
    returnsBarRef.current.style.width = returnsBarLength + "px";
    // setReturnsBarLength(returnsBarLength);

    const maxBarRight = maxBarRef.current.getBoundingClientRect().right;
    const returnsBarRight = returnsBarRef.current.getBoundingClientRect().right;
    if (maxBarRight - returnsBarRight < 20) {
      setHideMaxNumber(true);
    }
  }

  // function setReturnsNumberPosition() {
  //   const middle = returnsBarLength / 2;
  //   const numberMiddle = returnsNumberRef.current.getBoundingClientRect().width / 2;
  //   returnsNumberRef.current.style.left = returnsBarRef.current.getBoundingClientRect().left + (middle - numberMiddle) + "px";
  // }

  useEffect(() => {
    requestAnimationFrame(() => {
      setCurrentLength();
    })
  }, [initial, current, returns])

  useEffect(() => {
    requestAnimationFrame(() => {
      if (returns > 0) {
        determineReturnsBarLength();
      }
    })
  }, [returns, current, initial])

  // useEffect(() => {
  //   setReturnsNumberPosition();
  // }, [returnsBarLength])

  return(
    <div className="progress-bar">
      <div className="progress-bar-max" ref={maxBarRef}>
        <div className="progress-bar-current" ref={currentBarRef}>
          <div className="pb-current-number">{initial - current}</div>
        </div>
        {returns > 0 && (
          <div className="progress-bar-returns" ref={returnsBarRef}>
            <div className='pb-returns-number' ref={returnsNumberRef}>{returns}</div>
          </div>
        )}
        {!hideMaxNumber && (
          <div className="pb-max-number">{current - returns}</div>
        )}
      </div>
    </div>
  )
}

export default ProgressBar;
