import { useRef, useEffect } from "react";
import "./InventoriesAreaDashboard.scss";

function InventoryArea({top, left, height, width}) {
  const areaRef = useRef();

  function setArea() {
    areaRef.current.style.top = top + 60 + "px";
    areaRef.current.style.left = left + 10 +"px";
    areaRef.current.style.height = height - 5 + "px";
    areaRef.current.style.width = width - 10 + "px";
  };

  useEffect(() => {
    setArea();
  }, [top, left, height, width])

  return (
    <div className="inventory-area" ref={areaRef}>
      {height * width}
    </div>
  )
}

export default InventoryArea;
