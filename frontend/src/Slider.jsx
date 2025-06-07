import "./Slider.scss";
import {useState, useRef, useEffect, useLayoutEffect} from "react";

function Slider({value, setNewValue}) {
  const [horizontalDisplacement, setHorizontalDisplacement] = useState(0);
  const sliderBallRef = useRef();
  const sliderBarRef = useRef();
  const [isTracking, setTracking] = useState(false);
  const [barRight, setBarRight] = useState(0);
  const [barLeft, setBarLeft] = useState(0);

  useLayoutEffect(() => {
    if (sliderBarRef.current) {
      setBarRight(sliderBarRef.current.getBoundingClientRect().right)
      setBarLeft(sliderBarRef.current.getBoundingClientRect().left)
      const percent = (value - 0.8) / 0.7;
      const length = sliderBarRef.current.getBoundingClientRect().right - sliderBarRef.current.getBoundingClientRect().left
      const displacement = length * percent
      setHorizontalDisplacement(displacement);
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

      setHorizontalDisplacement(diff);
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
      <div className="slider-bar"
        ref={sliderBarRef}>
        <div className="slider-ball"
          ref={sliderBallRef}
          onMouseDown={() => setTracking(true)}
          style={{left:`${-4 + horizontalDisplacement}px`}}>
        </div>
      </div>
    </div>
  )
}

export default Slider;
