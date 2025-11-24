import "./OverlappingHorizontalGraphLines.scss";
import { useState, useRef, useLayoutEffect } from "react";

export default function OverlappingHorizontalGraphLines2({
    title,
    sold,
    given,
    current,
    returns,
    max}) {
  const [isTitleTooltipOpen, setTitleTooltipOpen] = useState(false);
  const titleRef = useRef();
  const [isEllipsed, setEllipsed] = useState(false);
  const [lengths, setLengths] = useState({
    current: 0,
    returns: 0,
    sold: 0,
    given: 0
  })
  const [savedLengths, setSavedLengths] = useState({
    current: 0,
    returns: 0,
    sold: 0,
    given: 0
  })
  const [maxLength, setMaxLength] = useState(0);

  const actualLinesRef = useRef();
  const numberGivenRef = useRef();
  const numberSoldRef = useRef();
  const numberReturnsRef = useRef();
  const numberCurrentRef = useRef();

  useLayoutEffect(() => {
    calcLengths()
  }, [sold, given, current, returns, max])

  function calcLengthOfNumbers(key) {
    const possibleValues = {
      "given": given,
      "sold": sold,
      "returns": returns,
      "current": current
    }
    const numLength = possibleValues[key] === 0 ? 0 : possibleValues[key].toString().length
    const additionalPixels = (numLength * 8) + 2
    return additionalPixels
  }

  function calcLengths() {
    const maxLength = actualLinesRef.current.getBoundingClientRect().width;
    setMaxLength(maxLength);

    const lines = [];
    for (const [key, value] of Object.entries(
      {"given": given,
      "sold": sold,
      "returns": returns,
      "current": current}
    )) {
      if (value) {
        lines.push([key, value])
      }
    }

    let total = given + sold + returns + current;

    const firstLengths = [];
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        const proportionalLength = (lines[i][1] / max) * maxLength;
        const min = calcLengthOfNumbers(lines[i][0]);
        const finalLength = proportionalLength < min ? min : proportionalLength;
        firstLengths.push([
          [lines[i][0]], finalLength
        ]);
      } else if (i === (lines.length - 1)) {
        const length = (total * maxLength) / max;

        let min = 0;
        if (firstLengths.length > 0) {
          min = firstLengths[0][1]
        }

        let finalLength = length < min ? min + length : length;
        
        firstLengths.push([
          [lines[i][0]], finalLength + 8
        ])
      } else {
        const proportionalLength = (lines[i][1] / max) * maxLength;
        const finalLength = proportionalLength + firstLengths[firstLengths.length - 1][1]
        firstLengths.push([
          [lines[i][0]], finalLength
        ])
      }
    }

    let objectFirstLengths = {};
    for (const entry of firstLengths) {
      objectFirstLengths[entry[0]] = entry[1]
    }

    for (const key of ["given", "sold", "returns", "current"]) {
      if (!objectFirstLengths[key]) {
        objectFirstLengths[key] = 0
      }
    }

    setLengths(objectFirstLengths);
    setSavedLengths(objectFirstLengths);

    // // adjust if needed 
    // if (firstLengths[firstLengths.length - 1][1] === maxLength) {
    //   //get min number (min pixels to display numbers)
    //   const mins = {
    //     "sold": calcLengthOfNumbers(sold),
    //     "returns": calcLengthOfNumbers(returns),
    //     "current": calcLengthOfNumbers(current),
    //   }

    //   // check for clashes
    //   let adjustedLengths = []
    //   for (let i = 0; i < firstLengths.length; i++) {
    //     if (i === 0) {
    //       adjustedLengths.push(firstLengths[i])
    //     } else if (i === firstLengths.length - 1) {
    //       adjustedLengths.push([firstLengths[i][0], (firstLengths[i][1] - lengthNumbersCurrent)]);
    //     } else {
    //       const necessaryLength = firstLengths[i][1] - mins[firstLengths[i][0]]
    //       if (necessaryLength < adjustedLengths[adjustedLengths - 1][1]) {
    //         const diff = adjustedLengths[adjustedLengths - 1][1]
    //         adjustedLengths.push([firstLengths[i][0], firstLengths[i][1] + diff])
    //       }
    //     }
    //   }

    

    // //get actual pixels in proportion to maxLength
    // const lengthBarGiven = (given / max) * maxLength;
    // const lengthBarSold = ((sold / max) * maxLength) + lengthBarGiven;
    // const lengthBarReturns = ((returns / max) * maxLength) + lengthBarSold;
    // const lengthBarCurrent = (total * maxLength) / max;

    // //minimums to display numbers for sold, returns and current
    // const minSold = lengthBarSold - lengthNumbersSold;
    // const minReturns = lengthBarReturns - lengthNumbersReturns;
    // const minCurrent = lengthBarCurrent - lengthNumbersCurrent;

    // // adjust if necessary
    // let finalGiven = 0;
    // let finalSold = minSold;
    // let finalReturns = minReturns;
    // let finalCurrent = lengthBarCurrent;

    // if (lengthBarGiven < lengthNumbersGiven) {
    //   finalGiven = lengthNumbersGiven;
    // } else {
    //   finalGiven = lengthBarGiven;
    // }

    // if (finalGiven > minSold) {
    //   const diff = finalGiven - minSold;
    //   finalSold = finalGiven + diff
    // }

    // if (finalSold > minReturns) {
    //   const diff = finalSold - minReturns;
    //   finalReturns = finalSold + diff
    // }

    // if (finalReturns > minCurrent) {
    //   const diff = finalReturns - minCurrent;
    //   const potentialFinalCurrent = finalReturns + diff;
    //   if (potentialFinalCurrent <= maxLength) {
    //     finalCurrent = potentialFinalCurrent;
    //   } else {
    //     //pushing back if we can't push out
    //     finalReturns -= diff
    //     if (finalSold > finalReturns) {
    //       const diffSoldReturns = finalSold - finalReturns;
    //       finalSold -= diffSoldReturns;
    //     }

    //     if (finalGiven > finalSold) {
    //       const diffGivenSold = finalGiven - finalSold;
    //       finalGiven -= diffGivenSold
    //     }
    //   }
    // }

    // // set everything
    // const finalLengths = {
    //   given: finalGiven,
    //   sold: finalSold,
    //   returns: finalReturns,
    //   current: finalCurrent
    // }

    // setSavedLengths(finalLengths);
    // setLengths(finalLengths);
  }

  function slightlyMove() {
    // let newGiven = 0;
    // let newSold = 0;
    // let newReturns = 0;
    // let newCurrent = 0;

    // if (lengths.given < calcLengthOfNumbers(given) - 2) {
    //   newGiven = lengths.given
    // } else {
    //   newGiven -= 2
    // }

    // newSold = lengths.sold + 2;
    // newReturns = lengths.returns + 2;
    
    // if (lengths.current + 2 < maxLength) {
    //   newCurrent = lengths.current + 2
    // } else {
    //   newCurrent = lengths.current;
    //   //push back if necessary
    //   const numbersCurrent = calcLengthOfNumbers(current);
    //   const minNewCurrent = newCurrent - numbersCurrent;
    //   if (newReturns > minNewCurrent) {
    //     const diff = newReturns - minNewCurrent;
    //     newReturns -= diff

    //     if (newSold > newReturns) {
    //       const diff = newSold - newReturns;
    //       newSold -= diff
    //     }
    //   }
    // }

    // const newLengths = {
    //   given: newGiven,
    //   sold: newSold,
    //   returns: newReturns,
    //   current: newCurrent
    // }

    // setLengths(newLengths);

    // determine which numbers are not being displayed successfully
    let actualLines = [];
    for (let i = 0; i < Object.entries(lengths).length; i++) {
      if (Object.entries(lengths)[i][1]) {
        actualLines.push([Object.entries(lengths)[i][0], Object.entries(lengths)[i][1]])
      }
    }

    if (actualLines.length <= 1) {
      return
    }

    let newLengths = [];
    for (let i = 0; i < actualLines.length; i++) {
      if (i === 0) {
        newLengths.push([[actualLines[i][0]], actualLines[i][1]]) 
        continue;
      } 

      if (i === actualLines.length -1) {
        const min = actualLines[i][1] - calcLengthOfNumbers(actualLines[i][0]);
        const diff = actualLines[i-1][1] - min
        if (diff > -4) {
          const potentialLength = actualLines[i][1] + diff
          const missing = calcLengthOfNumbers(actualLines[i][0])
          if (potentialLength > maxLength) {
            newLengths[actualLines[i-1][0]] -= missing
          } else {
            newLengths.push([[actualLines[i][0]], actualLines[i][1] + missing])
          }
        } else {
          newLengths.push([[actualLines[i][0]], actualLines[i][1]])
        }
        continue;
      }

      const min = actualLines[i][1] - calcLengthOfNumbers(actualLines[i][0]);
      const diff = actualLines[i-1][1] - min
      const missing = calcLengthOfNumbers(actualLines[i][0]);
      if (diff > 0) {
        newLengths.push([[actualLines[i][0]], actualLines[i][1] + missing])
      } else {
        newLengths.push([[actualLines[i][0]], actualLines[i][1]])
      }
    }

    let objectNewLengths = {};
    for (const entry of newLengths) {
      objectNewLengths[entry[0]] = entry[1]
    }

    for (const key of ["given", "sold", "returns", "current"]) {
      if (!objectNewLengths[key]) {
        objectNewLengths[key] = 0
      }
    }

    setLengths(objectNewLengths);
  } 

  function returnLengths() {
    setLengths(savedLengths);
  }

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
          <div className="ohgl-actual-lines"
            ref={actualLinesRef}
            onMouseEnter={slightlyMove}
            onMouseLeave={returnLengths}
            >
          {current > 0 && (
            <div
              className="ohgl-current"
              style={{width: `${lengths.current}px`}}
              ref={numberCurrentRef}>
              <div className="ohgl-current-number">
                {current}
              </div>
            </div>
          )}
          {sold > 0 && (
            <div
              className="ohgl-sold"
              style={{width: `${lengths.sold}px`}}
              ref={numberSoldRef}>
              <div className="ohgl-sold-number">
                {sold}
              </div>
            </div>)}
          {given > 0 && (
            <div
              className="ohgl-given"
              ref={numberGivenRef}
              style={{width: `${lengths.given}px`}}>
              <div className='ohgl-number'
                id='ohgl-number-given'>
                {given}
              </div>
            </div>)}
          {returns > 0 && (
            <div
              className="ohgl-returns"
              style={{width: `${lengths.returns}px`}}
              ref={numberReturnsRef}>
              <div className="ohgl-returns-number">
                {returns}
              </div>
            </div>)}
          </div>
      </div>
    </div>
  )
}