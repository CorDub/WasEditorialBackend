import "./Impression.scss";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

function Impression({impression}) {
  const [date, setDate] = useState("");
  const [isActionsOpen, setActionsOpen] = useState(false);
  const impressionGearRef = useRef();

  useEffect(() =>{
    const date = new Date(impression.createdAt);
    const formattedDate = date.toLocaleDateString();
    setDate(formattedDate);
  }, [impression])

  function openActions() {
    setActionsOpen(!isActionsOpen);
    if (impressionGearRef.current.classList.contains("opened")) {
      impressionGearRef.current.classList.remove("opened");
    } else {
      impressionGearRef.current.classList.add("opened");
    }
  }

  return(
    <div className="impression">
      <div className="impression-gear">
        <FontAwesomeIcon
          icon={faGear}
          onClick={openActions}
          ref={impressionGearRef}/>
      </div>
      {isActionsOpen &&
        <div className="impression-actions">
          <FontAwesomeIcon
            icon={faPen}
            className="impression-edit"/>
          <FontAwesomeIcon
            icon={faCircleXmark}
            className="impression-delete"/>
        </div>}
      <div className="impression-info">
        {date} - {impression.quantity} copias
      </div>
    </div>
  )
}

export default Impression;
