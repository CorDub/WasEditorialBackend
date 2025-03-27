import { useState, useRef, useEffect} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "./TableActions.scss";
import Tooltip from "./Tooltip";

function TableActions ({openModal, row, isTableActionsOpen, setTableActionsOpen}) {
  const gearRef = useRef();
  const buttonsRef = useRef();
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState('');

  function displayingActions() {
    if (gearRef.current.classList.contains("displaying")) {
      gearRef.current.classList.remove("displaying");
    } else {
      console.log("adding displaying");
      gearRef.current.classList.add("displaying");
      setTableActionsOpen(true);
    }

    if (buttonsRef.current.classList.contains("visible")) {
      buttonsRef.current.classList.remove("visible");
      buttonsRef.current.classList.add("invisible");
      setTimeout(() => {
        buttonsRef.current.classList.add("hidden");
      }, 200)
    } else {
      buttonsRef.current.classList.remove("hidden");
      setTimeout(() => {
        buttonsRef.current.classList.add("visible");
        buttonsRef.current.classList.remove("invisible");
      }, 5)
    }
  }

  useEffect(() => {
    console.log(isTableActionsOpen);
  }, [isTableActionsOpen]);

  // useEffect(() => {
  //   console.log(isTableActionsOpen);
  //   if (isTableActionsOpen === false) {
  //     gearRef.current.classList.remove("displaying");
  //     buttonsRef.current.classList.remove("visible");
  //     buttonsRef.current.classList.add("invisible");
  //     setTimeout(() => {
  //       buttonsRef.current.classList.add("hidden");
  //     }, 200)
  //   }
  // }, [isTableActionsOpen])

  function toggleTooltip(message, elementId) {
    if (x === null || y === null) {
      const element = document.getElementById(elementId);
      const elementRect = element.getBoundingClientRect();
      setY(elementRect.top);
      setX(elementRect.left);
      setTooltipMessage(message);
    } else {
      setY(null);
      setX(null);
      setTooltipMessage("");
    }
  }

  return(
    <div className="table-actions">
      <FontAwesomeIcon icon={faGear} className="ta-gear"
        onClick={displayingActions} ref={gearRef}/>
      <div className="ta-buttons hidden" ref={buttonsRef}>
        <Tooltip message={tooltipMessage} x={x} y={y}/>
        <FontAwesomeIcon icon={faPen} className="ta-button ta-edit" id={`ta-edit-${row.index}`}
          onClick={() => openModal("edit", row.original)}
          onMouseEnter={() => toggleTooltip("Editar", `ta-edit-${row.index}`)}
          onMouseLeave={() => toggleTooltip("Editar", `ta-edit-${row.index}`)}/>
        <FontAwesomeIcon icon={faCircleXmark} className="ta-button ta-delete" id={`ta-delete-${row.index}`}
          onClick={() => openModal("delete", row.original)}
          onMouseEnter={() => toggleTooltip("Eliminar", `ta-delete-${row.index}`)}
          onMouseLeave={() => toggleTooltip("Eliminar", `ta-delete-${row.index}`)}/>
      </div>
    </div>
  )
}

export default TableActions;
