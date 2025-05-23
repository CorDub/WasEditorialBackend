import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ProfilePage.scss";
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";


function ProfilePageLine({
    icon,
    title,
    field,
    value,
    setAlertMessage,
    setAlertType,
    forceRender,
    setForceRender}) {
  const [isEditOpen, setEditOpen] = useState(false);
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [newValue, setNewValue] = useState(value);

  async function updateProfileField() {
    console.log(newValue);
    if (newValue === value || newValue === "" || newValue === undefined) {
      setEditOpen(false);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          [field]: newValue
        })
      });

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`Su ${title.toLowerCase()} ha sido cambiado`);
        setAlertType("confirmation");
        setForceRender(!forceRender);
      }

    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    console.log(newValue);
  }, [newValue]);

  return(
    <div className="profile-page-line">
      <div className="profile-page-title">
        <FontAwesomeIcon icon={icon}
          className="profile-page-icon"/>
        <h2>{title}</h2></div>
      {isEditOpen
        ? <>
            <input type="text"
              className="global-input profile-page-input"
              placeholder={value}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}/>
            <FontAwesomeIcon icon={faPen}
              className="profile-page-edit"
              onClick={() => updateProfileField()} />
          </>
        : <>
          <div className="profile-page-value">{value}</div>
          <FontAwesomeIcon icon={faPen}
            className="profile-page-edit"
            onClick={() => setEditOpen(true)} />
          </>}
    </div>
  )
}

export default ProfilePageLine;
