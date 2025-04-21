import "./ProgressBar.scss";
import { useRef, useEffect, useState } from "react";

function ProgressBar({current, initial, returns, sold, given}) {
  const maxBarRef = useRef();
  const maxNumberRef = useRef();
  const soldBarRef = useRef();
  const soldNumberRef = useRef();
  const returnsBarRef = useRef();
  const returnsNumberRef = useRef();
  const givenBarRef = useRef();
  const givenNumberRef = useState();
  const [hideMaxNumber, setHideMaxNumber] = useState(false);
  const [hideGivenNumber, setHideGivenNumber] = useState(false);
  const [hideSoldNumber, setHideSoldNumber] = useState(false);
  const [hideReturnsNumber, setHideReturnsNumber] = useState(false);
  const [returnsBarLength, setReturnsBarLength] = useState(0);
  const [givenBarLength, setGivenBarLength] = useState(0);
  const [soldBarLength, setSoldBarLength] = useState(0);

  // function setCurrentLength() {
  //   const currentLength = Math.round(maxBarRef.current.getBoundingClientRect().width * sold / initial);
  //   currentBarRef.current.style.width = currentLength + 5 + "px";
  // }

  // function determineReturnsBarLength() {
  //   const currentBarRight = currentBarRef.current.getBoundingClientRect().right;
  //   const maxBarLeft = maxBarRef.current.getBoundingClientRect().left;
  //   const actualStart = currentBarRight - maxBarLeft;
  //   const returnsBarLength = maxBarRef.current.getBoundingClientRect().width * (returns / initial);
  //   returnsBarRef.current.style.left = actualStart - 5 + "px";
  //   returnsBarRef.current.style.width = returnsBarLength + "px";
  //   // setReturnsBarLength(returnsBarLength);

  //   const maxBarRight = maxBarRef.current.getBoundingClientRect().right;
  //   const returnsBarRight = returnsBarRef.current.getBoundingClientRect().right;
  //   if (maxBarRight - returnsBarRight < 20) {
  //     setHideMaxNumber(true);
  //   }
  // }

  function determineBarsLengths(bars) {
    const potentialBars = {
      0 : {
        ref: givenBarRef,
        length: setGivenBarLength,
        numRef: givenNumberRef,
        hide: setHideGivenNumber
      },
      1 : {
        ref: soldBarRef,
        length: setSoldBarLength,
        numRef: soldNumberRef,
        hide: setHideSoldNumber
      },
      2: {
        ref: returnsBarRef,
        length: setReturnsBarLength,
        numRef: returnsNumberRef,
        hide: setHideReturnsNumber
      }
    }
    let previousBarLength = 0;

    for (const index in bars) {
      const barLength =  Math.round(maxBarRef.current.getBoundingClientRect().width * bars[index] / initial + previousBarLength);
      potentialBars[index].ref.current.style.width = barLength + "px";
      const availableSpace = barLength - previousBarLength;
      const numberLength = potentialBars[index].numRef.current.getBoundingClientRect().width;
      console.log(availableSpace);
      if (availableSpace < numberLength + 10) {
        potentialBars[index].hide(true);
      }

      previousBarLength += barLength;
      potentialBars[index].length(barLength);
      // potentialBars[index].numRef.current.style.right = barLength - (barLength * 0.2) + "px";
      // const numberLength = potentialBars[index].numRef.current.getBoundingClientRect().width;
      // if (availableSpace < numberLength) {
      //   potentialBars[index].set(".");
      // }
    }
  }

  // useEffect(() => {
  //   console.log(givenBarLength, soldBarLength, returnsBarLength);
  // }, [returnsBarLength, givenBarLength, soldBarLength])

  // function setReturnsNumberPosition() {
  //   const middle = returnsBarLength / 2;
  //   const numberMiddle = returnsNumberRef.current.getBoundingClientRect().width / 2;
  //   returnsNumberRef.current.style.left = returnsBarRef.current.getBoundingClientRect().left + (middle - numberMiddle) + "px";
  // }

  useEffect(() => {
    requestAnimationFrame(() => {
      // setCurrentLength();
      determineBarsLengths([given, sold, returns]);
    })
  }, [initial, returns, sold, given])

  // useEffect(() => {
  //   requestAnimationFrame(() => {
  //     if (returns > 0) {
  //       determineReturnsBarLength();
  //     }
  //   })
  // }, [returns, current, initial])

  // useEffect(() => {
  //   setReturnsNumberPosition();
  // }, [returnsBarLength])

  return(
    <div className="progress-bar">
      <div className="progress-bar-max" ref={maxBarRef}>
        {/* <div className="progress-bar-current" ref={currentBarRef}>
          <div className="pb-current-number">{sold}</div>
        </div>
        {returns > 0 && (
          <div className="progress-bar-returns" ref={returnsBarRef}>
            <div className='pb-returns-number' ref={returnsNumberRef}>{returns}</div>
          </div>
        )}
        {!hideMaxNumber && (
          <div className="pb-max-number">{current - returns}</div>
        )}  */}

        <div className="progress-bar-returns" ref={returnsBarRef}>
          <div className="progress-bar-sold" ref={soldBarRef}>
            <div className="progress-bar-given" ref={givenBarRef}>
              {given > 0 && (
                <div className="pb-number" ref={givenNumberRef}>{!hideGivenNumber && given}</div>
              )}
            </div>
            {sold > 0 && (
              <div className="pb-number" ref={soldNumberRef}>{!hideSoldNumber && sold}</div>
            )}
          </div>
          {returns > 0 && (
            <div className="pb-number" ref={returnsNumberRef}>{!hideReturnsNumber && returns}</div>
          )}
        </div>
        {!hideMaxNumber && (
          <div className="pb-max-number" ref={maxNumberRef}>{initial-sold-returns-given}</div>
        )}
      </div>
    </div>
  )
}

export default ProgressBar;
