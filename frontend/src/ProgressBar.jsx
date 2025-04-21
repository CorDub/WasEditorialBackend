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
  const givenNumberRef = useRef();
  const [hideMaxNumber, setHideMaxNumber] = useState(false);
  const [hideGivenNumber, setHideGivenNumber] = useState(false);
  const [hideSoldNumber, setHideSoldNumber] = useState(false);
  const [hideReturnsNumber, setHideReturnsNumber] = useState(false);

  function determineBarsLengths(bars) {
    //Pass a list of the bars from smallest to be displayed on top (given), to longest (returns),
    //each one created under the previous one.
    const potentialBars = {
      0 : {
        ref: givenBarRef,
        numRef: givenNumberRef,
        hide: setHideGivenNumber
      },
      1 : {
        ref: soldBarRef,
        numRef: soldNumberRef,
        hide: setHideSoldNumber
      },
      2: {
        ref: returnsBarRef,
        numRef: returnsNumberRef,
        hide: setHideReturnsNumber
      }
    }
    let previousBarLength = 0;

    for (const index in bars) {
      // Set bar length proportionally to the max bar
      const barLength =  Math.round(maxBarRef.current.getBoundingClientRect().width * (bars[index] + previousBarLength) / initial);
      potentialBars[index].ref.current.style.width = barLength + "px";

      // Check whether to display the numbers or not
      const availableSpace = barLength - previousBarLength;
      if (potentialBars[index].numRef.current) {
        const numberLength = potentialBars[index].numRef.current.getBoundingClientRect().width;
        if (availableSpace < numberLength + 2) {
          potentialBars[index].hide(true);
        }
      };

      // Make sure each bar is longer than the previous one
      previousBarLength += barLength;

      // Extra check for the number of the max bar because it's not in the list of bars
      if (parseInt(index) === bars.length-1) {
        const maxBarLength = maxBarRef.current.getBoundingClientRect().width;
        const availableSpace = maxBarLength - previousBarLength;
        const maxNumberLength = maxNumberRef.current.getBoundingClientRect().width;
        if (availableSpace < maxNumberLength + 2) {
          setHideMaxNumber(true);
        }
      };
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      determineBarsLengths([given, sold, returns]);
    })
  }, [initial, returns, sold, given])

  return(
    <div className="progress-bar">
      <div className="progress-bar-max" ref={maxBarRef}>

              {given > 0 && (
                <div className="progress-bar-given" ref={givenBarRef}>
                  <div className="pb-number" ref={givenNumberRef}>{!hideGivenNumber && given}</div>
                </div>
              )}

            {sold > 0 && (
              <div className="progress-bar-sold" ref={soldBarRef}>
                <div className="pb-number" ref={soldNumberRef}>{!hideSoldNumber && sold}</div>
              </div>
            )}

          {returns > 0 && (
            <div className="progress-bar-returns" ref={returnsBarRef}>
              <div className="pb-number" ref={returnsNumberRef}>{!hideReturnsNumber && returns}</div>
            </div>
          )}

        <div className="pb-max-number" ref={maxNumberRef}>{!hideMaxNumber && initial-sold-returns-given}</div>
      </div>
    </div>
  )
}

export default ProgressBar;
