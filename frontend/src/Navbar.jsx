import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.scss"
import UserContext from "./UserContext";
import AdminNavbar from "./AdminNavbar";

function Navbar({ active }) {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

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
        <AdminNavbar active={active}/>
      </div>
      <div className='navbar-logout'>
        {(user !== '') &&
          <p className="grey-button" onClick={logout}>Cerrar sessión</p>}
      </div>
    </div>
  )
}

export default Navbar;
