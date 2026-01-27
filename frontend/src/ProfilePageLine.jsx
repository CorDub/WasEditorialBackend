import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ProfilePage.scss";
import { faPen, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef} from "react";
import useCheckUser from "./customHooks/useCheckUser";
import checkForErrors from "./customHooks/checkForErrors";

function ProfilePageLine({
    icon,
    title,
    field,
    value,
    setAlertMessage,
    setAlertType,
    forceRender,
    setForceRender,
    setErrors,
    preferredFontSize}) {
  const [isEditOpen, setEditOpen] = useState(false);
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [newValue, setNewValue] = useState(value);
  const inputRef = useRef();


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
      const response = await fetch(`${baseURL}/api/user/user`, {
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
    const expectationsLine = {
      type: "string",
      presence: "not empty",
    }
    if (field === "email") {
      expectationsLine['validity'] = "email valid"
    } else if (field === "phone") {
      expectationsLine['validity'] = "phone valid"
    }

    let errorsLine;

    if (field === "email") {
      errorsLine = checkForErrors("El correo que ingresabá", newValue, expectationsLine, inputRef);
    } else if (field === "phone") {
      errorsLine = checkForErrors("El numéro de téléfono que ingresabá", newValue, expectationsLine, inputRef);
    }

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
          className="profile-page-icon fa-icon"/>
        <h2 style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>{title}</h2></div>
      {isEditOpen
        ? <>
            <input type="text"
              className="global-input profile-page-input"
              style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}
              placeholder={value}
              value={newValue}
              ref={inputRef}
              onChange={(e) => setNewValue(e.target.value.toLocaleLowerCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateProfileField();
                }
              }}/>
            <FontAwesomeIcon icon={ faCircleCheck }
              className="profile-page-edit profile-page-edit-open fa-icon"
              onClick={() => updateProfileField()} />
          </>
        : <>
          <div className="profile-page-value"
            style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
              {value}</div>
          <FontAwesomeIcon icon={faPen}
            className="profile-page-edit fa-icon"
            onClick={() => setEditOpen(true)} />
          </>}
    </div>
  )
}

export default ProfilePageLine;
