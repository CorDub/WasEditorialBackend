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
  phonePrefix,
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
  const [newPhonePrefix, setNewPhonePrefix] = useState(phonePrefix || "+52");
  const phoneRef = useRef();
  const phonePrefixRef = useRef();
  const [sortedCountryCodes, setSortedCountryCodes] = useState([]);

  useEffect(() => {
    if (value) {
      // Get the prefix and sort the list based on this
      // get the code
      const prefix = phonePrefix;
      const phoneNumber = value;

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
      setNewPhonePrefix(prefix)
      setPhone(phoneNumber)
      setNewValue(newPhonePrefix + phoneNumber)
      setDisplayValue(newPhonePrefix + phoneNumber)
      setSortedCountryCodes(sortedCountryCodeList)
    } else {
      // find the current country in the list
      let sortedCountryCodeList = [];
      const currentCountryCode = countryCallingCodes.find(element => element.code === newPhonePrefix)

      // sort the list
      sortedCountryCodeList.push(currentCountryCode);
      for (const country of countryCallingCodes) {
        if (country.code === newPhonePrefix) { continue }
        sortedCountryCodeList.push(country)
      }

      //set the list
      setSortedCountryCodes(sortedCountryCodeList)
    }
  }, [value])

  useEffect(() => {
    setNewValue(newPhonePrefix + phone)
    setDisplayValue(newPhonePrefix + phone)
  }, [phone, newPhonePrefix])

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
          "phone": phone,
          "phonePrefix": newPhonePrefix,
        })
      });

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`Su número de teléfono ha sido actualizado`);
        setAlertType("confirmation");
        setForceRender(prev => !prev);
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
    const phonePrefixExpectations = {
      validity: "phonePrefix valid"
    }

    const errorsPhone = checkForErrors("El teléfono", phone, phoneExpectations, phoneRef, "o")
    const errorsPhonePrefix = checkForErrors("El prefijo de país", newPhonePrefix, phonePrefixExpectations, phonePrefixRef, "o")
    const errorInputs = [errorsPhone, errorsPhonePrefix]

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
                ref={phonePrefixRef}
                onChange={(e) => setNewPhonePrefix(e.target.value)}>
                {sortedCountryCodes.map((country, index) => (
                  <option key={index} value={country.code}>{country.iso3} {country.code}</option>
                ))}
              </select>
              <input type='text'
                inputMode="numeric"
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
