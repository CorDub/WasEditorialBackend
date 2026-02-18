import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ProfilePage.scss";
import { faPen, faCircleCheck, faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import checkForErrors from "./customHooks/checkForErrors";
import './ProfilePageBirthday.scss';

function ProfilePageBirthday(
  {value,
  preferredFontSize,
  setAlertMessage,
  setAlertType,
  forceRender,
  setForceRender,
  setErrors}) {
  const [isEditOpen, setEditOpen] = useState(false);
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [newValue, setNewValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const dayRef = useRef();
  const monthRef = useRef();
  const yearRef = useRef();

  useEffect(() => {
    if (value) {
      setDisplayValue(value.substring(0,2)+"/"+value.substring(2,4)+"/"+value.substring(4,8));
      setDay(value.substring(0,2))
      setMonth(value.substring(2,4))
      setYear(value.substring(4,8))
    }
  }, [value])

  useEffect(() => {
      setNewValue(day.padStart(2, "0") + month.padStart(2, "0") + year)
    }, [day, month, year])

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
          "birthday": newValue
        })
      });

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`Su fecha de nacimiento ha sido actualizada`);
        setAlertType("confirmation");
        setForceRender(prev => !prev);
      }

    } catch (error) {
      console.log(error);
    }
  }

  function checkInputs() {
    let errorsList = []
    const birthdayDayExpectations = {
      minimum: 1,
      maximum: 31
    }
    const birthdayMonthExpectations = {
      minimum: 1,
      maximum: 12
    }
    const birthdayYearExpectations = {
      maximum: new Date().getFullYear(),
      minimum: (new Date().getFullYear() - 120)
    }

    const errorsBirthdayDay = checkForErrors("Día de nacimiento", day, birthdayDayExpectations, dayRef, "o")
    const errorsBirthdayMonth = checkForErrors("Mes de nacimiento", month, birthdayMonthExpectations, monthRef, "o")
    const errorsBirthdayYear = checkForErrors("Año de nacimiento", year, birthdayYearExpectations, yearRef, "o")
    const errorInputs = [
      errorsBirthdayDay,
      errorsBirthdayMonth,
      errorsBirthdayYear
    ]

    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

  return(
    <div className="profile-page-line">
      <div className="profile-page-title">
        <FontAwesomeIcon icon={faCakeCandles}
          className="profile-page-icon fa-icon"/>
        <h2 style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>Fecha de nacimiento</h2></div>
      {isEditOpen
        ? <>
            <div className="modal-birthday profile-birthday-line">
              <input type="text"
                placeholder="dd"
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
                value={day}
                className="global-input birthday-day no-margin"
                maxLength="2"
                ref={dayRef}
                onChange={(e) => setDay(e.target.value)}></input>
              <input type="text"
                placeholder="mm"
                value={month}
                className="global-input birthday-month no-margin"
                maxLength="2"
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
                ref={monthRef}
                onChange={(e) => setMonth(e.target.value)}></input>
              <input type="text"
                placeholder="aaaa"
                value={year}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
                className="global-input birthday-year no-margin"
                maxLength="4"
                ref={yearRef}
                onChange={(e) => setYear(e.target.value)}></input>
            </div>
            <FontAwesomeIcon icon={ faCircleCheck }
              className="profile-page-edit profile-page-edit-open fa-icon"
              onClick={() => updateProfileField()} />
          </>
        : <>
          <div className="profile-page-value"
            style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
              {displayValue}</div>
          <FontAwesomeIcon icon={faPen}
            className="profile-page-edit fa-icon"
            onClick={() => setEditOpen(true)} />
          </>}
    </div>
  )
}

export default ProfilePageBirthday;
