import "./OverlappingHorizontalGraphLines.scss";
import { useState, useEffect, useRef, useLayoutEffect } from "react";

function OverlappingHorizontalGraphLines({
    title,
    color,
    sold,
    given,
    current,
    returns,
    max}) {
  const [isTitleTooltipOpen, setTitleTooltipOpen] = useState(false);
  const titleRef = useRef();
  const [isEllipsed, setEllipsed] = useState(false);
  const [newLengths, setNewLengths] = useState({
    current: 0,
    returns: 0,
    sold: 0,
    given: 0
  })
  const [savedLengths, setSavedLengths] = useState(null);
  const [numberWidths, setNumberWidths] = useState({
    current: 0,
    returns: 0,
    sold: 0,
    given: 0
  })
  // const [isGivenNumberHidden, setGivenNumberHidden] = useState(false);
  // const [isSoldNumberHidden, setSoldNumberHidden] = useState(false);
  // const [isReturnsNumberHidden, setReturnsNumberHidden] = useState(false);
  // const [isCurrentNumberHidden, setCurrentNumberHidden] = useState(false);
  const actualLinesRef = useRef();
  const numberGivenRef = useRef();
  const numberSoldRef = useRef();
  const numberReturnsRef = useRef();
  const numberCurrentRef = useRef();

  function getLength(type, max) {
    switch (type) {
      case 'current': 
        return (((current + sold + returns + given) * 100) / max) 
      case 'returns':
        return (((given + sold + returns) * 100) / max) 
      case 'sold':
        return (((given + sold) * 100) / max) 
      case 'given': {
        return ((given * 100) / max) 
      }
    }
  }

  function getLength2(type, max) {
    function calcMinLength(value, max) {
      // const maxInPixels = actualLinesRef.current.getBoundingClientRect().width;
      // console.log(maxInPixels);
      const numLength = value === 0 ? 0 : value.toString().length
      const additionalPixels = (numLength * 8)
      const additionalProportion = (additionalPixels * 100 / max)
      return additionalProportion
    }

    const baseCalcGivenPercent = ((given * 100) / max)
    const minGivenPercent = calcMinLength(given, max)
    let finalGivenPercent = 0;
    if (baseCalcGivenPercent <= minGivenPercent) {
      finalGivenPercent = minGivenPercent
    } else {
      finalGivenPercent = baseCalcGivenPercent
    }

    const baseCalcSoldPercent = (((given + sold) * 100) / max)
    const minSoldPercent = calcMinLength(sold, max)
    // check if number is visible
    let finalSoldPercent = 0;
    if ((baseCalcSoldPercent - minSoldPercent) < finalGivenPercent) {
      finalSoldPercent = baseCalcSoldPercent + (finalGivenPercent - (baseCalcSoldPercent - minSoldPercent))
    } else {
      finalSoldPercent = baseCalcSoldPercent
    }

    const baseCalcReturnsPercent = (((given + sold + returns) * 100) / max) 
    const minReturnsPercent = calcMinLength(returns, max)
    // check if number is visible
    let finalReturnsPercent = 0;
    if ((baseCalcReturnsPercent - minReturnsPercent) < finalSoldPercent) {
      finalReturnsPercent = baseCalcReturnsPercent + (finalSoldPercent - (baseCalcReturnsPercent - minReturnsPercent))
    } else {
      finalReturnsPercent = baseCalcReturnsPercent
    }

    const baseCalcCurrentPercent = (((current + sold + returns + given) * 100) / max) 
    const minCurrentPercent = calcMinLength(returns, max)
    let finalCurrentPercent = baseCalcCurrentPercent;
    // check if number is visible

    if (returns === 0 && sold === 0) {
      if ((baseCalcCurrentPercent - minCurrentPercent) < finalGivenPercent) {
        const diff = ((baseCalcCurrentPercent - minCurrentPercent) - finalGivenPercent)
        finalCurrentPercent = baseCalcCurrentPercent + diff;
      }

    } else if (returns === 0 && sold > 0) {
      if ((baseCalcCurrentPercent - minCurrentPercent) < finalSoldPercent) {
        const diff = ((baseCalcCurrentPercent - minCurrentPercent) - finalSoldPercent)
        if ((baseCalcCurrentPercent + difference) <= 100) {
          finalCurrentPercent = baseCalcCurrentPercent + difference
        } else {
          if ((finalSoldPercent - diff) < finalGivenPercent) {
            finalGivenPercent -= diff
            finalSoldPercent -= diff
          } else {
            finalSoldPercent -= diff
          }
        } 
      }
    } else if (returns > 0 && sold > 0) {
      if ((baseCalcCurrentPercent - minCurrentPercent) < finalReturnsPercent) {
        const difference = finalReturnsPercent - (baseCalcCurrentPercent - minCurrentPercent)
        if ((baseCalcCurrentPercent + difference) <= 100) {
          finalCurrentPercent = baseCalcCurrentPercent + difference
        } else {
          finalCurrentPercent = baseCalcCurrentPercent
          if ((finalReturnsPercent - difference) < finalSoldPercent) {
            finalSoldPercent = finalSoldPercent - difference 
            finalReturnsPercent = finalReturnsPercent - difference
          } else {
            finalReturnsPercent = finalReturnsPercent - difference
          }
        }
      }
    }
    switch (type) {
      case 'current': 
        return finalCurrentPercent
      case 'returns':
        return finalReturnsPercent
      case 'sold':
        return finalSoldPercent 
      case 'given': {
        return finalGivenPercent 
      }
    }
  }

  // make sure we display a tooltip only if the text is ellipsed
  useEffect(() => {
    requestAnimationFrame(() => {
      if (titleRef.current) {
        if (titleRef.current.scrollWidth > titleRef.current.clientWidth) {
          setEllipsed(true);
        }
      }

      const newLengths = {
        current: getLength2('current', max),
        returns: getLength2('returns', max),
        sold: getLength2('sold', max),
        given: getLength2('given', max)
      }
      setNewLengths(newLengths);
    })
  }, [max]);



  // useLayoutEffect(() => {
  //   getLength2()
  // }, [max])

  // hide number if overflowing
  useLayoutEffect(() => {
    hideOverflow();
  }, [sold, given, current, returns, max])

  function hideOverflow() {
    const available_width = actualLinesRef.current.getBoundingClientRect().width;
    const newLengthsEstimates = {
      current: getLength('current', max) * available_width / 100,
      returns: getLength('returns', max) * available_width / 100,
      sold: getLength('sold', max) * available_width / 100,
      given: getLength('given', max) * available_width / 100,
    };

    // this is the only way I found to make sure I have the actual number widths
    // scroll widths keeps changing
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    let numberLengths = {
      current: 0,
      returns: 0,
      sold: 0,
      given: 0
    };

    if (numberGivenRef.current) {
      context.font = `${numberGivenRef.current.fontSize} ${numberGivenRef.current.fontFamily}`
      numberLengths.given = context.measureText(given).width
    };

    if (numberSoldRef.current) {
      context.font = `${numberSoldRef.current.fontSize} ${numberSoldRef.current.fontFamily}`
      numberLengths.sold = context.measureText(sold).width
    }

    if (numberReturnsRef.current) {
      context.font = `${numberReturnsRef.current.fontSize} ${numberReturnsRef.current.fontFamily}`
      numberLengths.returns = context.measureText(returns).width
    }

    if (numberCurrentRef.current) {
      context.font = `${numberCurrentRef.current.fontSize} ${numberCurrentRef.current.fontFamily}`
      numberLengths.current = context.measureText(current).width
    }

    // if (numberLengths.given + 4 > newLengthsEstimates.given) {
    //   setGivenNumberHidden(true)
    // } else {
    //   setGivenNumberHidden(false)
    // }

    // if (numberLengths.sold + 4 > newLengthsEstimates.sold) {
    //   setSoldNumberHidden(true)
    // } else {
    //   setSoldNumberHidden(false)
    // }

    // if (numberLengths.returns + 4 > newLengthsEstimates.returns) {
    //   setReturnsNumberHidden(true)
    // } else {
    //   setReturnsNumberHidden(false)
    // }

    // if (numberLengths.current + 4 > newLengthsEstimates.current) {
    //   setCurrentNumberHidden(true)
    // } else {
    //   setCurrentNumberHidden(false)
    // }

    setNumberWidths(numberLengths);
  }

  function displayAllNumbers() {
    const available_width = actualLinesRef.current.getBoundingClientRect().width;
    setSavedLengths({...newLengths});
    let displayLengths = {...newLengths};
    let availableLengths = {
      current: 0,
      returns: 0,
      sold: 0,
      given: 0
    }

    function percentsToPixels(percent) {
      return percent * available_width / 100
    }

    function pixelsToPercents(pixel) {
      return pixel * 100 / available_width
    }

    let displayLengthsPixels = {
      current: percentsToPixels(displayLengths.current),
      returns: percentsToPixels(displayLengths.returns),
      sold: percentsToPixels(displayLengths.sold),
      given: percentsToPixels(displayLengths.given)
    }

    //Given
    if (numberWidths.given + 4 > percentsToPixels(newLengths.given)) {
      displayLengthsPixels.given += numberWidths.given + 4
    } else {
      availableLengths.given = percentsToPixels(newLengths.given) - numberWidths.given
    }

    //Sold
    const necessarySold = displayLengthsPixels.given - (displayLengthsPixels.sold - numberWidths.sold - 4);
    if (displayLengthsPixels.given > (displayLengthsPixels.sold - numberWidths.sold - 16)) {
      if (availableLengths.given > 0) {
        let remaining = necessarySold + 18
        if (availableLengths.given < necessarySold) {
          displayLengthsPixels.given -= availableLengths.given
          remaining -= availableLengths.given
        } else {
          displayLengthsPixels.given -= necessarySold
        }

        if (remaining > 0) {
          displayLengthsPixels.sold += remaining;
          remaining = 0;
        }
      } else {
        displayLengthsPixels.sold += necessarySold;
      }
    } else {
      availableLengths.sold = displayLengthsPixels.sold - numberWidths.sold - displayLengthsPixels.given;
    }

    //Returns
    const necessaryReturns = displayLengthsPixels.sold - (displayLengthsPixels.returns - numberWidths.returns - 4);
    if (displayLengthsPixels.sold > (displayLengthsPixels.returns - numberWidths.returns - 16)) {
      if (availableLengths.sold > 0) {
        let remaining = necessaryReturns + 18
        if (availableLengths.sold < necessaryReturns) {
          displayLengthsPixels.sold -= availableLengths.given
          remaining -= availableLengths.sold
        } else {
          displayLengthsPixels.sold -= necessaryReturns
        }

        if (remaining > 0) {
          displayLengthsPixels.returns += remaining;
          remaining = 0;
        }
      } else {
        displayLengthsPixels.returns += necessarySold;
      }
    } else {
      availableLengths.returns = displayLengthsPixels.returns - numberWidths.returns - displayLengthsPixels.sold;
    }

    //Current
    const necessaryCurrent = displayLengthsPixels.returns - (displayLengthsPixels.current - numberWidths.current);
    if (displayLengthsPixels.returns > (displayLengthsPixels.current - numberWidths.current - 16)) {
      if (availableLengths.sold > 0) {
        let remaining = necessaryCurrent + 18
        if (availableLengths.sold < necessaryCurrent) {
          displayLengthsPixels.returns -= availableLengths.given
          remaining -= availableLengths.sold
        } else {
          displayLengthsPixels.returns -= necessaryCurrent
        }

        if (remaining > 0) {
          displayLengthsPixels.current += remaining;
          remaining = 0;
        }
      } else {
        displayLengthsPixels.current += necessarySold;
      }
    } else {
      availableLengths.returns = displayLengthsPixels.current - numberWidths.current - displayLengthsPixels.returns;
    }

    displayLengths.current = pixelsToPercents(displayLengthsPixels.current) 
    displayLengths.returns = pixelsToPercents(displayLengthsPixels.returns)
    displayLengths.sold = pixelsToPercents(displayLengthsPixels.sold)
    displayLengths.given = pixelsToPercents(displayLengthsPixels.given)

    setNewLengths(displayLengths);
    // setGivenNumberHidden(false)
    // setSoldNumberHidden(false)
    // setReturnsNumberHidden(false)
    // setCurrentNumberHidden(false)
  }

  function returnLengths() {
    setNewLengths(savedLengths);
    hideOverflow();
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
            onMouseEnter={displayAllNumbers}
            onMouseLeave={returnLengths}>
          {current > 0 && (
            <div
              className="ohgl-current"
              style={{width: `${newLengths.current}%`}}
              ref={numberCurrentRef}>
              <div className="ohgl-current-number">
                {/* {isCurrentNumberHidden? "" : current} */}
                {current}
              </div>
            </div>
          )}
          {sold > 0 && (
            <div
              className="ohgl-sold"
              // style={{width: `${newLengths.sold}%`}}
              style={{width: `${newLengths.sold}%`}}
              ref={numberSoldRef}>
              <div className="ohgl-sold-number">
                {/* {isSoldNumberHidden ? "" : sold} */}
                {sold}
              </div>
            </div>)}
          {given > 0 && (
            <div
              // className={isGivenNumberHidden ? "ohgl-given no-padding" : "ohgl-given"}
              className="ohgl-given"
              ref={numberGivenRef}
              style={{width: `${newLengths.given}%`}}>
              <div className='ohgl-number'
                id='ohgl-number-given'>
                {/* {isGivenNumberHidden ? "" : given} */}
                {given}
              </div>
            </div>)}
          {returns > 0 && (
            <div
              className="ohgl-returns"
              style={{width: `${newLengths.returns}%`}}
              ref={numberReturnsRef}>
              <div className="ohgl-returns-number">
                {/* {isReturnsNumberHidden ? "" : returns} */}
                {returns}
              </div>
            </div>)}
          </div>
      </div>
    </div>
  )
}

export default OverlappingHorizontalGraphLines;
