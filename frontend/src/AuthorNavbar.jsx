import { useEffect } from "react";
import { Link } from "react-router-dom";

function AuthorNavbar({ active }) {

  function declareButtonActive(active) {
    const buttons = document.querySelectorAll(".navbar-button");
    // Cleanup of any precedent active state
    buttons.forEach((button) => {
      if (button.classList.contains(".active-button")) {
        button.classList.remove(".active-button");
      }
    });

    if (active === "ventas") {
      buttons[0].classList.add("active-button");
      return;
    };

    if (active === "inventario") {
      buttons[1].classList.add("active-button");
      return;
    };

    if (active === "kindle") {
      buttons[2].classList.add("active-button");
      return;
    };
  }

  useEffect(() => {
    declareButtonActive(active);
  }, [active])

  return(
    <div className="admin-navbar">
      <Link to='/author/sales' className="navbar-button">Ventas</Link>
      <Link to='/author/inventory' className="navbar-button">Inventario</Link>
      {/* <Link to='/admin/bookstores' className="navbar-button">Kindle</Link> */}
    </div>
  )
}

export default AuthorNavbar;
