import "./OverlappingHorizontalGraphLines.scss";
import { useState, useRef, useLayoutEffect, useEffect } from "react";

export default function OverlappingHorizontalGraphLines2({
    title,
    scope,
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
  const [spanValue, setSpanValue] = useState("incl."); 
  const [adjustedCurrent, setAdjustedCurrent] = useState(0);

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
  }

  function slightlyMove() {
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
        const diff = newLengths[i-1][1] - min
        if (diff > -4) {
          const potentialLength = actualLines[i][1] + diff
          const missing = calcLengthOfNumbers(actualLines[i][0]) + diff
          if (potentialLength > maxLength) {
            newLengths[actualLines[i-1][0]] -= missing + 8
          } else {
            newLengths.push([[actualLines[i][0]], actualLines[i][1] + missing + 8])
          }
        } else {
          newLengths.push([[actualLines[i][0]], actualLines[i][1]])
        }
        continue;
      }

      const min = actualLines[i][1] - calcLengthOfNumbers(actualLines[i][0]);
      const diff = newLengths[i-1][1] - min
      const missing = calcLengthOfNumbers(actualLines[i][0]) + diff;
      if (diff > 0) {
        newLengths.push([[actualLines[i][0]], actualLines[i][1] + missing + 8])
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

  function adjustForReturns() {
    let res = "";
    let adjustedCurrent = 0;
    if (scope === "bookstore"  && title === "Plataforma Was") {
      res = " + "
      adjustedCurrent -= returns 
    } else if (scope === "bookstore" && title !== "Plataforma Was") {
      res = " - "
      adjustedCurrent += returns
    } else {
      res = "incl."
    }
    setSpanValue(res)
    setAdjustedCurrent(adjustedCurrent)
  }

  useEffect(() => {
    adjustForReturns()
  }, [scope, title])

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
                  {returns > 0 && (
                    <div className="ohgl-returns-number">
                      <p>
                        <span className="incl">
                          {spanValue}
                        </span>
                        {returns}
                      </p>
                    </div>
                  )}
                  {returns > 0 
                    ? current + adjustedCurrent
                    : current
                  }
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
            {/* {returns > 0 && (
              <div
                className="ohgl-returns"
                style={{width: `${lengths.returns}px`}}
                ref={numberReturnsRef}>
                <div className="ohgl-returns-number">
                  {returns}
                </div>
              </div>)} */}
          </div>
      </div>
    </div>
  )
}