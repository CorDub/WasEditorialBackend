import Navbar from "./Navbar";
import useCheckUser from "./customHooks/useCheckUser";
import UserContext from "./UserContext";
import { useContext, useState, useEffect } from "react";
import "./ProfilePage.scss";
import { faEnvelope, faEarthAmericas, faFont, faPhone } from '@fortawesome/free-solid-svg-icons';
import ProfilePageLine from "./ProfilePageLine";
import Alert from "./Alert";
import ProfilePageDropDown from "./ProfilePageDropDown";
import { Link } from "react-router-dom";
import ErrorsList from "./ErrorsList";
import ProfilePageSlider from "./ProfilePageSlider";
import ProfilePageBankDetails from "./ProfilePageBankDetails";
import ProfilePageBirthday from "./ProfilePageBirthday";
import ProfilePagePhone from "./ProfilePagePhone";

function ProfilePage() {
  useCheckUser();
  const { user, fetchUser } = useContext(UserContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [errors, setErrors] = useState([])
  const [extraInfo, setExtraInfo] = useState(null)
  const baseURL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchUser()
    getExtraInfo()
  }, [forceRender])

  async function getExtraInfo() {
    try {
      const response = await fetch(`${baseURL}/api/user/user_extra`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setExtraInfo(data);
      }
    } catch(error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (user.id) {
      getExtraInfo();
    }
  }, [user.id])

  return(
    <div className="profile-page"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar
        subNav={user && user.role}
        active={"profile"} />
      <div className="profile-page-personal">
        <div className="profile-page-lines-container">
          <ProfilePageLine
            icon={faEnvelope}
            title={'Correo'}
            field={"email"}
            value={user.email}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}
            preferredFontSize={user.font_size}/>
          {/* <ProfilePageLine
            icon={faPhone}
            title={"Téléfono"}
            field={"phone"}
            value={user.phone}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}
            preferredFontSize={user.font_size}/> */}
          <ProfilePagePhone
            icon={faPhone}
            title={'Teléfono'}
            field={"phone"}
            value={user.phone}
            phonePrefix={extraInfo ? extraInfo.phonePrefix : "+52"}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}
            preferredFontSize={user.font_size}/>
          {/* <ProfilePageDropDown
            icon={faEarthAmericas}
            title={"País"}
            field={"country"}
            value={user.country}
            possibleValues={countries}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}
            preferredFontSize={user.font_size}/> */}
          <ProfilePageBirthday
            value={extraInfo && extraInfo.birthday}
            preferredFontSize={user.font_size}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}/>
          {/* <ProfilePageSlider
            icon={faFont}
            title={"Tamaño de las letras"}
            value={user.font_size}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            preferredFontSize={user.font_size}/> */}
          <ProfilePageBankDetails
            preferredFontSize={user.font_size}
            accountNumber={extraInfo && extraInfo.clabe}
            accountHolder={extraInfo && extraInfo.name_bank_account}
            bank={extraInfo && extraInfo.bank}
            swift={extraInfo && extraInfo.swift}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setErrors={setErrors}
            setForceRender={setForceRender}/>
          <ErrorsList errors={errors} setErrors={setErrors}/>
          <Link to="/forgotten-password"
            className="profile-page-change-password">
                Cambiar su contraseña
          </Link>
        </div>
      </div>
      <Alert
        message={alertMessage}
        type={alertType}
        setAlertMessage={setAlertMessage}
        setAlertType={setAlertType}/>
    </div>
  )
}

export default ProfilePage;
