import { useEffect } from "react";
import { Link } from "react-router-dom";

function AdminNavbar({ active }) {
  console.log(active);

  function declareButtonActive(active) {
    const buttons = document.querySelectorAll(".navbar-button");
    console.log(buttons);
    // Cleanup of any precedent active state
    buttons.forEach((button) => {
      if (button.classList.contains(".active-button")) {
        button.classList.remove(".active-button");
      }
    });

    if (active === "autores") {
      buttons[0].classList.add("active-button");
      return;
    };

    if (active === "libros") {
      buttons[1].classList.add("active-button");
      return;
    };

    if (active === "librerias") {
      buttons[2].classList.add("active-button");
      return;
    };

    if (active === "categorias") {
      buttons[3].classList.add("active-button");
      return;
    };
  }

  useEffect(() => {
    declareButtonActive(active);
  }, [active])

  return(
    <div className="admin-navbar">
      <Link to='/admin/authors' className="navbar-button">Autores</Link>
      <Link to='/admin/books' className="navbar-button">Libros</Link>
      <Link to='/admin/bookstores' className="navbar-button">Librerías</Link>
      <Link to='/admin/categories' className="navbar-button">Categorias</Link>
    </div>
  )
}

export default AdminNavbar;
