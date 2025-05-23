import "./ProfilePage.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import useCheckUser from "./customHooks/useCheckUser";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";

function ProfilePageDropDown({
    icon,
    title,
    field,
    value,
    possibleValues,
    setAlertMessage,
    setAlertType,
    forceRender,
    setForceRender,
    setErrors}) {
  useCheckUser();
  const [isEditOpen, setEditOpen] = useState(false);
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [newValue, setNewValue] = useState(value);
  const selectRef = useRef();

  async function updateProfileField() {
    if (newValue === value || newValue === "" || newValue === undefined) {
      setEditOpen(false);
      return;
    }

    setErrors([]);
    const errors = checkInputs();
    if (errors.length > 0) {
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

  function checkInputs() {
    let errorList = []
    const expectationsDropDown = {
      type: "string",
      presence: "not empty",
      value: possibleValues,
    }

    const errorsLine = checkForErrors("El país", newValue, expectationsDropDown, selectRef);

    if (errorsLine.length > 0) {
      errorList.push(errorsLine);
      setErrors(errorList);
    }

    return errorList;
  }

  return(
    <div className="profile-page-line">
      <div className="profile-page-title">
        <FontAwesomeIcon icon={icon}
          className="profile-page-icon"/>
        <h2>{title}</h2></div>
      {isEditOpen
        ? <>
            <select className="select-global profile-page-input"
              ref={selectRef}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateProfileField();
                }
              }}>
              <option value={value}>Selecciona pais</option>
              {possibleValues && possibleValues.map((value, index) => (
                <option
                  key={index}
                  value={value}>{value}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faCircleCheck}
              className="profile-page-edit profile-page-edit-open"
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

export default ProfilePageDropDown;
