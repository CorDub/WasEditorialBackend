import { useRef, useEffect } from "react";
import "./InventoriesAreaDashboard.scss";

function InventoryArea({name, count, top, left, height, width}) {
  const areaRef = useRef();

  function setArea() {
    areaRef.current.style.top = top + 60 + "px";
    areaRef.current.style.left = left + 10 +"px";
    areaRef.current.style.height = height - 10 + "px";
    areaRef.current.style.width = width - 10 + "px";
  };

  useEffect(() => {
    setArea();
  }, [top, left, height, width])

  return (
    <div className="inventory-area" ref={areaRef}>
      {name} {count}
    </div>
  )
}

export default InventoryArea;
