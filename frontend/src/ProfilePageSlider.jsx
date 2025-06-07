import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import { faPen, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Slider from "./Slider";
import "./ProfilePageSlider.scss";

function ProfilePageSlider({
  icon,
  title,
  value,
  setAlertMessage,
  setAlertType,
  forceRender,
  setForceRender
}) {
  const [isEditOpen, setEditOpen] = useState(false);
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [newValue, setNewValue] = useState(value);

  async function closeAndSave() {
    try {
      const response = await fetch(`${baseURL}/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          font_size: parseFloat(newValue)
        })
      });

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`El tamaño de las letras ha sido cambiado`);
        setAlertType("confirmation");
        setForceRender(!forceRender);
      }
    } catch (error) {
      console.log(error);
    }

    setEditOpen(false);
  }

  return (
    <div className="profile-page-line">
      <div className="profile-page-title">
        <FontAwesomeIcon icon={icon} className="profile-page-icon"/>
        <h2>{title}</h2>
      </div>
    {isEditOpen
      ? <div className="profile-page-slider-edit">
          <div className="profile-page-slider-top">
            <Slider className="profile-page-slider-open"
              value={value}
              setNewValue={setNewValue}/>
            <div className="profile-page-slider-example"
              style={{fontSize: `${newValue}rem`}}>
              <p>Ejemplo</p>
            </div>
          </div>
          <FontAwesomeIcon icon={ faCircleCheck }
            className="profile-page-edit profile-page-edit-open"
            onClick={closeAndSave}/>
        </div>
      : <>
        <div className="profile-page-value"><Slider value={value}/></div>
        <FontAwesomeIcon icon={faPen}
          className="profile-page-edit"
          onClick={() => setEditOpen(true)} />
        </>
      }
    </div>
  )
}

export default ProfilePageSlider;
