import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.scss"
import UserContext from "./UserContext";
import AdminNavbar from "./AdminNavbar";
import SuperAdminNavbar from "./SuperAdminNavbar";
import AuthorNavbar from "./AuthorNavbar";

function Navbar({ subNav, active, setBookstoreInventoryOpen, setSelectedBookstore, retreat, setRetreat }) {
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

  function chooseSubNavbar(subNav) {
    switch (subNav) {
      case "superadmin":
        return <SuperAdminNavbar
                  active={active}
                  setBookstoreInventoryOpen={setBookstoreInventoryOpen}
                  setSelectedBookstore={setSelectedBookstore}
                  retreat={retreat}
                  setRetreat={setRetreat}/>
      case "admin":
        return <AdminNavbar active={active}/>
      case "author":
        return <AuthorNavbar active={active}/>
      default:
        console.log('Unkown error')
        return;
    }
  }

  return (
    <div className="navbar">
      <div className="navbar-home">
        {chooseSubNavbar(subNav)}
      </div>
      <div className='navbar-logout'>
        {(user !== '') &&
          <p className="grey-button" onClick={logout}>Cerrar sessión</p>}
      </div>
    </div>
  )
}

export default Navbar;
