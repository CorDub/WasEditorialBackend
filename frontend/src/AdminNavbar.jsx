import { useEffect, useRef, useState, useContext } from "react";
import { Link } from "react-router-dom";
import InventoriesContext from "./InventoriesContext";
import SearchResults from "./SearchResults";

function AdminNavbar({
    active,
    setBookstoreInventoryOpen,
    setSelectedBookstore,
    setSelectedBookstoreNoSpaces,
    setSelectedBook,
    setBookInventoryOpen,
    retreat,
    setRetreat }) {
  const searchBarRef = useRef();
  const [searchTerms, setSearchTerms] = useState("");
  const { inventories, fetchInventories } = useContext(InventoriesContext);
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

    // if (active === "inventorias") {
    //   buttons[4].classList.add("active-button");
    //   return;
    // };

    if (active === "inventories2") {
      searchBarRef.current.focus();
      return;
    }

    if (active === "ventas") {
      buttons[5].classList.add("active-button");
      return;
    };
  }

  useEffect(() => {
    declareButtonActive(active);
  }, [active])

  function getListOfInventories() {
    let inventoryNames = [];
    for (const inventory of inventories) {
      const names = inventoryNames.map(item => item.name)

      if (!names.includes(inventory.book.title)) {
        inventoryNames.push({name: inventory.book.title, type: 'book'})
      }

      if (!names.includes(inventory.bookstore.name)) {
        inventoryNames.push({name:inventory.bookstore.name, type: "bookstore"})
      }
    }
    setinventoryNames(inventoryNames);
  }

  useEffect(() => {
    if (!inventories) {
      fetchInventories();
    }
    getListOfInventories();
  }, [inventories])

  useEffect(() => {
    if (active === "inventories2") {
      searchBarRef.current.classList.add("navbar-extended");
    }
  }, [active]);

  function searchThroughInventoryNames(searchTerm) {
    const res = [];
    for (const inventory of inventoryNames) {
      const nameBeginning = inventory.name.substring(0, searchTerm.length);
      if (searchTerm.toLowerCase() === nameBeginning.toLowerCase()) {
        res.push(inventory);
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
      <Link to='/admin/authors' className="navbar-button">Autores</Link>
      <Link to='/admin/books' className="navbar-button">Libros</Link>
      <Link to='/admin/bookstores' className="navbar-button">Librerías</Link>
      <Link to='/admin/categories' className="navbar-button">Categorias</Link>
      {/* <Link to='/admin/inventories' className="navbar-button">Inventarios</Link> */}
      {active === "inventories2" ?
        <>
          <input
            type="text"
            className="navbar-input"
            placeholder="Busca un inventario"
            ref={searchBarRef}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            ></input>
          {searchTerms ?
            <SearchResults
              searchResults={searchResults}
              searchBarRef={searchBarRef}
              setBookstoreInventoryOpen={setBookstoreInventoryOpen}
              setSelectedBookstore={setSelectedBookstore}
              setSelectedBookstoreNoSpaces={setSelectedBookstoreNoSpaces}
              setSelectedBook={setSelectedBook}
              setBookInventoryOpen={setBookInventoryOpen}
              retreat={retreat}
              setRetreat={setRetreat}
              setSearchTerms={setSearchTerms}/> :
            null
          }
        </>:
        <Link to='/admin/inventories2' className="navbar-button">Inventarios</Link>
      }
      <Link to='/admin/sales' className="navbar-button">Ventas</Link>
    </div>
  )
}

export default AdminNavbar;
