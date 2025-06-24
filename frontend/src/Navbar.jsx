import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.scss"
import UserContext from "./UserContext";
import AdminNavbar from "./AdminNavbar";
import SuperAdminNavbar from "./SuperAdminNavbar";
import AuthorNavbar from "./AuthorNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom";

function Navbar({
    subNav,
    active,
    setBookstoreInventoryOpen,
    setSelectedBookstore,
    setSelectedBookstoreNoSpaces,
    setSelectedBook,
    setSelectedBookId,
    setBookInventoryOpen,
    retreat,
    setRetreat }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  async function logout() {
    const response = fetch(`${baseURL}/api/logout`, {
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
      sessionStorage.clear();
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
                  setSelectedBookstoreNoSpaces={setSelectedBookstoreNoSpaces}
                  setSelectedBook={setSelectedBook}
                  setSelectedBookId={setSelectedBookId}
                  setBookInventoryOpen={setBookInventoryOpen}
                  retreat={retreat}
                  setRetreat={setRetreat}
                  preferredFontSize={user.font_size}/>
      case "admin":
        return <AdminNavbar
                  active={active}
                  setBookstoreInventoryOpen={setBookstoreInventoryOpen}
                  setSelectedBookstore={setSelectedBookstore}
                  setSelectedBookstoreNoSpaces={setSelectedBookstoreNoSpaces}
                  setSelectedBook={setSelectedBook}
                  setBookInventoryOpen={setBookInventoryOpen}
                  retreat={retreat}
                  setRetreat={setRetreat}
                  preferredFontSize={user.font_size}/>
      case "author":
        return <AuthorNavbar
                  active={active}
                  preferredFontSize={user.font_size}/>
      default:
        console.log('Unkown error')
        return;
    }
  }

  return (
    <div className="navbar"
      style={
        window.innerWidth <= 1300
          ? { fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}
          : { fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}
      }>
      <div className="navbar-home">
        {chooseSubNavbar(subNav)}
      </div>
      <div className='navbar-logout'>
        <Link to='/profile-page'  className="navbar-profile">
          <FontAwesomeIcon icon={faUser}
            className={active === "profile" ? "navbar-profile-icon-active" : "navbar-profile-icon"}/>
        </Link>
        {(user !== '') &&
          <p className="grey-button" onClick={logout}>Cerrar sesión</p>}
      </div>
    </div>
  )
}

export default Navbar;
