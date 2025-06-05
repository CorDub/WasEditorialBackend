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
  const [isGivenNumberHidden, setGivenNumberHidden] = useState(false);
  const [isSoldNumberHidden, setSoldNumberHidden] = useState(false);
  const [isReturnsNumberHidden, setReturnsNumberHidden] = useState(false);
  const [isCurrentNumberHidden, setCurrentNumberHidden] = useState(false);
  const actualLinesRef = useRef();
  const numberGivenRef = useRef();
  const numberSoldRef = useRef();
  const numberReturnsRef = useRef();
  const numberCurrentRef = useRef();

  function getLength(type, max) {
    switch (type) {
      case 'current':
        // console.log('current: ', ((current + sold + returns + given) * 100) / max)
        return ((current + sold + returns + given) * 100) / max
      case 'returns':
        // console.log('returns', ((given + sold + returns) * 100) / max)
        return ((given + sold + returns) * 100) / max
      case 'sold':
        // console.log('sold', ((given + sold) * 100) / max)
        return ((given + sold) * 100) / max
      case 'given':
        return (given * 100) / max
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
        current: getLength('current', max),
        returns: getLength('returns', max),
        sold: getLength('sold', max),
        given: getLength('given', max)
      }
      setNewLengths(newLengths);
    })
  }, [max]);

  // hide number if overflowing
  useLayoutEffect(() => {
    hideOverflow();
  }, [])

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

    if (numberLengths.given > newLengthsEstimates.given) {
      setGivenNumberHidden(true)
    } else {
      setGivenNumberHidden(false)
    }

    if (numberLengths.sold > newLengthsEstimates.sold) {
      setSoldNumberHidden(true)
    } else {
      setSoldNumberHidden(false)
    }

    if (numberLengths.returns > newLengthsEstimates.returns) {
      setReturnsNumberHidden(true)
    } else {
      setReturnsNumberHidden(false)
    }

    if (numberLengths.current > newLengthsEstimates.current) {
      setCurrentNumberHidden(true)
    } else {
      setCurrentNumberHidden(false)
    }

    setNumberWidths(numberLengths);
  }

  function displayAllNumbers() {
    setSavedLengths({...newLengths});
    let displayLengths = {...newLengths};
    let availableLengths = {
      current: 0,
      returns: 0,
      sold: 0,
      given: 0
    }
    console.log(displayLengths);
    console.log(numberWidths);

    //Given
    if (numberWidths.given > newLengths.given) {
      displayLengths.given += numberWidths.given
    } else {
      availableLengths.given = newLengths.given - numberWidths.given
    }

    //Sold
    const necessarySold = displayLengths.given - (newLengths.sold - numberWidths.sold);
    if (displayLengths.given > (newLengths.sold - numberWidths.sold)) {
      if (availableLengths.given > 0) {
        let remaining = necessarySold
        if (availableLengths.given < necessarySold) {
          displayLengths.given -= availableLengths.given
          remaining -= availableLengths.given
        } else {
          displayLengths.given -= necessarySold
        }

        if (remaining > 0) {
          displayLengths.sold += remaining;
          remaining = 0;
        }
      } else {
        displayLengths.sold += necessarySold;
      }
    } else {
      availableLengths.sold = displayLengths.sold - numberWidths.sold - displayLengths.given;
    }

    //Returns
    const necessaryReturns = displayLengths.sold - (newLengths.returns - numberWidths.returns);
    if (displayLengths.sold > (newLengths.returns - numberWidths.returns)) {
      if (availableLengths.sold > 0) {
        let remaining = necessaryReturns
        if (availableLengths.sold < necessaryReturns) {
          displayLengths.sold -= availableLengths.given
          remaining -= availableLengths.sold
        } else {
          displayLengths.sold -= necessaryReturns
        }

        if (remaining > 0) {
          displayLengths.returns += remaining;
          remaining = 0;
        }
      } else {
        displayLengths.returns += necessarySold;
      }
    } else {
      availableLengths.returns = displayLengths.returns - numberWidths.returns - displayLengths.sold;
    }

    //Current
    const necessaryCurrent = displayLengths.returns - (newLengths.current - numberWidths.current);
    if (displayLengths.returns > (newLengths.current - numberWidths.current)) {
      if (availableLengths.sold > 0) {
        let remaining = necessaryCurrent
        if (availableLengths.sold < necessaryCurrent) {
          displayLengths.returns -= availableLengths.given
          remaining -= availableLengths.sold
        } else {
          displayLengths.returns -= necessaryCurrent
        }

        if (remaining > 0) {
          displayLengths.current += remaining;
          remaining = 0;
        }
      } else {
        displayLengths.current += necessarySold;
      }
    } else {
      availableLengths.returns = displayLengths.current - numberWidths.current - displayLengths.returns;
    }
    setNewLengths(displayLengths);
    setGivenNumberHidden(false)
    setSoldNumberHidden(false)
    setReturnsNumberHidden(false)
    setCurrentNumberHidden(false)
    console.log(displayLengths);
  }

  function returnLengths() {
    setNewLengths({...savedLengths});
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
                {isCurrentNumberHidden? "" : current}
              </div>
            </div>
          )}
          {sold > 0 && (
            <div
              className="ohgl-sold"
              style={{width: `${newLengths.sold}%`}}
              ref={numberSoldRef}>
              <div className="ohgl-sold-number">
                {isSoldNumberHidden ? "" : sold}
              </div>
            </div>)}
          {given > 0 && (
            <div
              className="ohgl-given"
              ref={numberGivenRef}
              style={{width: `${newLengths.given}%`}}>
              <div className='ohgl-number'
                id='ohgl-number-given'>
                {isGivenNumberHidden ? "" : given}
              </div>
            </div>)}
          {returns > 0 && (
            <div
              className="ohgl-returns"
              style={{width: `${newLengths.returns}%`}}
              ref={numberReturnsRef}>
              <div className="ohgl-returns-number">
                {isReturnsNumberHidden ? "" : returns}
              </div>
            </div>)}
          </div>
      </div>
    </div>
  )
}

export default OverlappingHorizontalGraphLines;
