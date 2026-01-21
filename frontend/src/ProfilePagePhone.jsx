import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ProfilePage.scss";
import { faPen, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";
import checkForErrors from "./customHooks/checkForErrors";
import { countryCallingCodes } from "../countryCodes";

function ProfilePagePhone(
  {icon,
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
  const [newValue, setNewValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [phone, setPhone] = useState("");
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const phoneRef = useRef();
  const [sortedCountryCodes, setSortedCountryCodes] = useState([]);

  useEffect(() => {
    if (value) {
      // Get the prefix and sort the list based on this
      // get the code
      const codeLength = value.length - 10;
      const prefix = value.substring(0, codeLength);
      const phoneNumber = value.substring(codeLength, value.length);

      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === prefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === prefix) { continue }
        sortedCountryCodeList.push(country)
      }

      // set everything
      setPhonePrefix(prefix)
      setPhone(phoneNumber)
      setNewValue(phonePrefix + phoneNumber)
      setDisplayValue(phonePrefix + phoneNumber)
      setSortedCountryCodes(sortedCountryCodeList)
    } else {
      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === phonePrefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === phonePrefix) { continue }
        sortedCountryCodeList.push(country)
      }

      //set the list
      setSortedCountryCodes(sortedCountryCodeList)
    }
  }, [value])

  useEffect(() => {
    setNewValue(phonePrefix + phone)
  }, [phone, phonePrefix])

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
          "phone": newValue
        })
      });

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`Su número de teléfono ha sido actualizado`);
        setAlertType("confirmation");
        setForceRender(!forceRender);
      }

    } catch (error) {
      console.log(error);
    }
  }

  function checkInputs() {
    let errorsList = []

    const phoneExpectations = {
      validity: "phone valid"
    }

    const errorsPhone = checkForErrors("El teléfono", newValue, phoneExpectations, phoneRef, "o")
    const errorInputs = [errorsPhone]

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
        <FontAwesomeIcon icon={icon}
          className="profile-page-icon fa-icon"/>
        <h2 style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>Teléfono</h2></div>
      {isEditOpen
        ? <>
            <div className="modal-birthday profile-birthday-line">
              <select className="select-phone"
                onChange={(e) => setPhonePrefix(e.target.value)}>
                {sortedCountryCodes.map((country, index) => (
                  <option key={index} value={country.code}>{country.iso3} {country.code}</option>
                ))}
              </select>
              <input type='text'
                inputmode="numeric"
                pattern="[0-9]*"
                className="input-phone" id="adding-author-teléfono"
                ref={phoneRef}
                value={phone}
                onKeyDown={(e) => {if (e.key.length === 1 && !/[0-9]/.test(e.key)) {e.preventDefault();}}}
                onChange={(e) => setPhone(e.target.value)}></input>
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

export default ProfilePagePhone;
