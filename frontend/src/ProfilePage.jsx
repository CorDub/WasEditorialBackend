import Navbar from "./Navbar";
import useCheckUser from "./customHooks/useCheckUser";
import UserContext from "./UserContext";
import { useContext, useState, useEffect } from "react";
import "./ProfilePage.scss";
import { faEnvelope, faEarthAmericas } from '@fortawesome/free-solid-svg-icons';
import ProfilePageLine from "./ProfilePageLine";
import Alert from "./Alert";

function ProfilePage() {
  useCheckUser();
  const { user, fetchUser } = useContext(UserContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    fetchUser()
  }, [forceRender])

  return(
    <div className="profile-page">
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
            setForceRender={setForceRender}/>
          <ProfilePageLine
            icon={faEarthAmericas}
            title={"País"}
            field={"country"}
            value={user.country}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            setForceRender={setForceRender}/>
          <div className="profile-page-change-password">
            Cambiar su contraseña
          </div>
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
