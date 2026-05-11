import "./Slider.scss";
import {useState, useRef, useEffect, useLayoutEffect} from "react";

function Slider({value, setNewValue, isEditOpen}) {
  const [horizontalDisplacement, setHorizontalDisplacement] = useState(0);
  const sliderBallRef = useRef();
  const sliderBarRef = useRef();
  const [isTracking, setTracking] = useState(false);
  const [barRight, setBarRight] = useState(0);
  const [barLeft, setBarLeft] = useState(0);
  const [gradations, setGradations] = useState({
    "0.8": 0,
    "0.9": 0,
    "1.0": 0,
    "1.1": 0,
    "1.2": 0,
    "1.3": 0,
    "1.4": 0,
    "1.5": 0
  })

  useLayoutEffect(() => {
    if (sliderBarRef.current) {
      const barRight = sliderBarRef.current.getBoundingClientRect().right
      const barLeft = sliderBarRef.current.getBoundingClientRect().left
      setBarRight(barRight);
      setBarLeft(barLeft)
      const percent = (value - 0.8) / 0.7;
      const length = barRight - barLeft
      const displacement = length * percent
      setHorizontalDisplacement(displacement);

      const newGradations = {
        "0.8": 0,
        "0.9": ((barRight-barLeft) / 7),
        "1.0": (((barRight-barLeft) / 7) *2),
        "1.1": (((barRight-barLeft) / 7) *3),
        "1.2": (((barRight-barLeft) / 7) *4),
        "1.3": (((barRight-barLeft) / 7) *5),
        "1.4": (((barRight-barLeft) / 7) *6),
        "1.5": (((barRight-barLeft) / 7) *7)
      }
      setGradations(newGradations);
    }
  }, [value])

  useEffect(() => {
    function moveBall(e) {
      let diff = e.clientX - barLeft;
      if (diff < 0 ) {
        diff = 0;
      }

      if (diff > (barRight - barLeft)) {
        diff = barRight - barLeft;
      }

      let closest = null;
      let smallestDiff = Infinity;

      for (const grade of Object.entries(gradations)) {
        const distance = Math.abs(diff - grade[1])
        if (distance < smallestDiff) {
          smallestDiff = distance;
          closest = grade[1];
        }
      }

      setHorizontalDisplacement(closest);
      const percent = diff / (barRight - barLeft);
      const newValue = (percent * 0.7) + 0.8 ;
      setNewValue(newValue);
    }

    function stopTracking() {
      setTracking(false)
    }

    if (isTracking) {
      window.addEventListener("mousemove", moveBall);
      window.addEventListener("mouseup", stopTracking);
    }

    return () => {
      window.removeEventListener("mousemove", moveBall);
      window.removeEventListener("mouseup", stopTracking);
    }

  }, [isTracking])

  return(
    <div className="slider">
      <div className={isEditOpen ? "slider-bar slider-bar-open" : "slider-bar slider-bar-closed"}
        ref={sliderBarRef}>
        {isEditOpen
          ? <div className="slider-ball"
            ref={sliderBallRef}
            onMouseDown={() => setTracking(true)}
            style={{left:`${-7.5 + horizontalDisplacement}px`}}></div>
          : <div className="slider-ball slider-ball-closed"
            ref={sliderBallRef}
            style={{left:`${-7.5 + horizontalDisplacement}px`}}></div>
        }
      </div>
      {isEditOpen && (
        <div className="slider-scale">
          {(Object.entries(gradations)).map((gradation, index) => (
            <div className="slider-scale-grade"
              style={{ left: `${gradation[1]}px`}}
              key={index}>
              {gradation[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Slider;
