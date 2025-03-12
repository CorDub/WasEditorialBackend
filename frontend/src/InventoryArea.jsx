import { useRef, useEffect } from "react";
import "./InventoriesAreaDashboard.scss";

function InventoryArea({key, top, left, height, width}) {
  const areaRef = useRef();

  function setArea() {
    areaRef.current.style.top = top + 50 + "px";
    areaRef.current.style.left = left + "px";
    areaRef.current.style.height = height + "px";
    areaRef.current.style.width = width  + "px";
  };

  useEffect(() => {
    setArea();
  }, [])

  return (
    <div className="inventory-area" ref={areaRef}>
    </div>
  )
}

export default InventoryArea;
