import { useEffect, useRef, useState, useContext } from "react";
import { Link } from "react-router-dom";
import InventoriesContext from "./InventoriesContext";
import SearchResults from "./SearchResults";

function SuperAdminNavbar({ active }) {
  const searchBarRef = useRef();
  const [searchTerms, setSearchTerms] = useState("");
  const { inventories } = useContext(InventoriesContext);
  const [inventoryNames, setinventoryNames] = useState([]);
  const [searchResults, setsearchResults] = useState([]);

  function declareButtonActive(active) {
    const buttons = document.querySelectorAll(".navbar-button");
    // Cleanup of any precedent active state
    buttons.forEach((button) => {
      if (button.classList.contains(".active-button")) {
        button.classList.remove(".active-button");
      }
    });

    if (active === "admins") {
      buttons[0].classList.add("active-button");
      return;
    }

    if (active === "autores") {
      buttons[1].classList.add("active-button");
      return;
    };

    if (active === "libros") {
      buttons[2].classList.add("active-button");
      return;
    };

    if (active === "librerias") {
      buttons[3].classList.add("active-button");
      return;
    };

    if (active === "categorias") {
      buttons[4].classList.add("active-button");
      return;
    };

    if (active === "inventorias") {
      buttons[5].classList.add("active-button");
      return;
    }

    if (active === "ventas") {
      buttons[6].classList.add("active-button");
      return;
    }

    if (active === "inventories2") {
      searchBarRef.current.focus();
      return;
    }
  }

  useEffect(() => {
    declareButtonActive(active);
  }, [active])

  function getListOfInventories() {
    let inventoryNames = [];
    for (const inventory of inventories) {
      if (!inventoryNames.includes(inventory.book.title)) {
        inventoryNames.push(inventory.book.title)
      }

      if (!inventoryNames.includes(inventory.bookstore.name)) {
        inventoryNames.push(inventory.bookstore.name)
      }
    }
    setinventoryNames(inventoryNames);
  }

  useEffect(() => {
    getListOfInventories();
  }, [inventories])

  function searchThroughInventoryNames(searchTerm) {
    const res = [];
    for (const inventoryName of inventoryNames) {
      const nameBeginning = inventoryName.substring(0, searchTerm.length);
      if (searchTerm.toLowerCase() === nameBeginning.toLowerCase()) {
        res.push(inventoryName);
        if (res.length >= 5) {
          return res;
        }
      }
    }
    return res;
  }

  useEffect(() => {
    const res = searchThroughInventoryNames(searchTerms);
    if (searchTerms) {
      setsearchResults(res);
    };
  }, [searchTerms])

  return(
    <div className="admin-navbar">
      <Link to='/superadmin/admins' className="navbar-button">Administradores</Link>
      <Link to='/admin/authors' className="navbar-button">Autores</Link>
      <Link to='/admin/books' className="navbar-button">Libros</Link>
      <Link to='/admin/bookstores' className="navbar-button">Librerías</Link>
      <Link to='/admin/categories' className="navbar-button">Categorias</Link>
      <Link to='/admin/inventories' className="navbar-button">Inventarios</Link>
      <Link to='/admin/sales' className="navbar-button">Ventas</Link>
      {active === "inventories2" ?
        <>
          <input
            type="text"
            className="navbar-input"
            placeholder="Busca un inventario"
            ref={searchBarRef}
            onChange={(e) => setSearchTerms(e.target.value)}
            ></input>
          {searchTerms ?
            <SearchResults
              searchResults={searchResults}
              searchBarRef={searchBarRef}/> :
            null
          }
        </>:
        <Link to='/admin/inventories2' className="navbar-button">Inventory2</Link>
      }
    </div>
  )
}

export default SuperAdminNavbar;
