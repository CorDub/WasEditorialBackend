import Navbar from "./Navbar";
import useCheckUser from "./customHooks/useCheckUser";
import UserContext from "./UserContext";
import { useContext, useState, useEffect } from "react";
import "./ProfilePage.scss";
import { faEnvelope, faEarthAmericas } from '@fortawesome/free-solid-svg-icons';
import ProfilePageLine from "./ProfilePageLine";
import Alert from "./Alert";
import ProfilePageDropDown from "./ProfilePageDropDown";
import { Link } from "react-router-dom";
import ErrorsList from "./ErrorsList";

function ProfilePage() {
  useCheckUser();
  const { user, fetchUser } = useContext(UserContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const countries = [
    "México", "Estados Unidos",
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán",
    "Bahamas", "Bangladés", "Baréin", "Barbados", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Bélgica",
    "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba",
    "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini (Suazilandia)", "Etiopía",
    "Filipinas", "Finlandia", "Fiyi", "Francia",
    "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana",
    "Haití", "Honduras", "Hungría",
    "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
    "Jamaica", "Japón", "Jordania",
    "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait",
    "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
    "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique",
    "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda",
    "Omán",
    "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia",
    "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
    "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu",
    "Ucrania", "Uganda", "Uruguay", "Uzbekistán",
    "Vanuatu", "Vaticano", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabue"
  ];
  const [errors, setErrors] = useState([])

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
            setForceRender={setForceRender}
            setErrors={setErrors}/>
          <ProfilePageDropDown
            icon={faEarthAmericas}
            title={"País"}
            field={"country"}
            value={user.country}
            possibleValues={countries}
            setAlertMessage={setAlertMessage}
            setAlertType={setAlertType}
            forceRender={forceRender}
            setForceRender={setForceRender}
            setErrors={setErrors}/>
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
