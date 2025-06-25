import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// import InventoriesContext from "./InventoriesContext";
import SearchResults from "./SearchResults";

function SuperAdminNavbar({
    active,
    setBookstoreInventoryOpen,
    setSelectedBookstore,
    setSelectedBookstoreNoSpaces,
    setSelectedBook,
    setSelectedBookId,
    setBookInventoryOpen,
    retreat,
    setRetreat,
    preferredFontSize }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const searchBarRef = useRef();
  const [searchTerms, setSearchTerms] = useState("");
  // const { inventories, fetchInventories } = useContext(InventoriesContext);
  // const [inventories, setInventories] = useState([]);  
  const [inventoryNames, setInventoryNames] = useState([]);
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

    if (active === "inventories") {
      searchBarRef.current.focus();
      return;
    }

    if (active === "ventas") {
      buttons[6].classList.add("active-button");
      return;
    }

    if (active === "payments") {
      buttons[7].classList.add("active-button");
      return;
    }

    if (active === "costs") {
      buttons[8].classList.add("active-button");
      return;
    }
  }

  useEffect(() => {
    declareButtonActive(active);
  }, [active])

  // function getListOfInventories() {
  //   let inventoryNames = [];
  //   for (const inventory of inventories) {
  //     const names = inventoryNames.map(item => item.name)

  //     if (!names.includes(inventory.book.title)) {
  //       inventoryNames.push({name: inventory.book.title, type: 'book', id: inventory.bookId})
  //     }

  //     if (!names.includes(inventory.bookstore.name)) {
  //       inventoryNames.push({name:inventory.bookstore.name, type: "bookstore", id: inventory.bookstoreId})
  //     }
  //   }
  //   setinventoryNames(inventoryNames);
  // }

  // useEffect(() => {
  //   // if (!inventories) {
  //   //   fetchInventories();
  //   // }
  //   getListOfInventories();
  // }, [inventories])

  useEffect(() => {
    if (active === "inventories") {
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

  async function fetchInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventoryNames`, {
        method: "GET",
        headers: {
          "Content-Type":"application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryNames(data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchInventories()
  }, []);

  return(
    <div className="admin-navbar"
      style={
        window.innerWidth <= 1300
          ? { fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.1rem)`}
          : { fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}
      }>
      <Link to='/superadmin/admins' className="navbar-button">Administradores</Link>
      <Link to='/admin/authors' className="navbar-button">Autores</Link>
      <Link to='/admin/books' className="navbar-button">Libros</Link>
      <Link to='/admin/bookstores' className="navbar-button">Librerías</Link>
      <Link to='/admin/categories' className="navbar-button">Categorias</Link>
      {active === "inventories" ?
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
              setSelectedBookId={setSelectedBookId}
              setBookInventoryOpen={setBookInventoryOpen}
              retreat={retreat}
              setRetreat={setRetreat}
              setSearchTerms={setSearchTerms}/> :
            null
          }
        </>:
        <Link to='/admin/inventories' className="navbar-button">Inventarios</Link>
      }
      <Link to='/admin/sales' className="navbar-button">Ventas</Link>
      <Link to='/admin/payments' className="navbar-button">Pagos</Link>
      <Link to='/admin/costs' className="navbar-button">Costos</Link>
    </div>
  )
}

export default SuperAdminNavbar;
