import { useContext } from "react";
import { useNavigate } from "react-router-dom";
// import logo from './assets/logo-03-300x110-was.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import "./Navbar.scss"
import UserContext from "./UserContext";
import AdminNavbar from "./AdminNavbar";

function Navbar({ active }) {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function navigateHome() {
    console.log(user.user.is_admin);
    if (user === null) {
      navigate('/');
    };

    if (user.user.is_admin === true) {
      navigate('/admin');
    }

    if (user.user.is_admin === false) {
      navigate('/author');
    }
  }

  async function logout() {
    const response = fetch("http://localhost:3000/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
    });

    if (response.ok === false) {
      return alert("Something went wrong when logging out.");
    } else {
      setUser(null);
      navigate('/');
    }
  }

  return (
    <div className="navbar">
      <div className="navbar-home">
        <FontAwesomeIcon icon={faHouse} onClick={navigateHome} className="navbar-icon"/>
        <AdminNavbar active={active}/>
      </div>
      {/* <div className="navbar-logo">
        <img src={logo} alt="was-editorial-logo" className="navbar-srcLogo"></img>
      </div> */}
      <div className='navbar-logout'>
        {(user !== '') &&
          <p className="grey-button" onClick={logout}>Logout</p>}
      </div>
    </div>
  )
}

export default Navbar;
