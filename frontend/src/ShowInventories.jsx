import './ShowInventories.scss';
import { useRef, useEffect } from "react";
import useCheckUser from './customHooks/useCheckUser';

function ShowInventories({
    inventories,
    currentDetailsActive,
    nameDetailsActive,
    setNameDetailsActive,
    setCurrentDetailsActive,
    setTotalInventoryOpen,
    setGivenToAuthorOpen,
    setBooksSoldGraphOpen,
    setAuthorBookstoreInventoryOpen,
    setAuthorWasInventoryOpen,
    setAuthorAvailableInventoryOpen}) {
  useCheckUser();
  const totalRef = useRef();
  const givenRef = useRef();
  const soldRef = useRef();
  const bookstoreRef = useRef();
  const wasRef = useRef();
  const availableRef = useRef();

  //ensure that totalRef is the default so that something is displayed
  useEffect(() => {
    if (currentDetailsActive === null) {
      setCurrentDetailsActive(totalRef);
    }
  }, [currentDetailsActive])

  function declareActive(ref, name, toggleFunction) {
    // highlight clicked detail, and open corresponding component
    if (ref === currentDetailsActive) {
      return;
    };

    const toggleFunctions = {
      total: setTotalInventoryOpen,
      given: setGivenToAuthorOpen,
      sold: setBooksSoldGraphOpen,
      bookstore: setAuthorBookstoreInventoryOpen,
      was: setAuthorWasInventoryOpen,
      available: setAuthorAvailableInventoryOpen
    }

    currentDetailsActive.current.classList.remove("show-inventory-active");
    ref.current.classList.add("show-inventory-active");
    toggleFunctions[nameDetailsActive](false);

    setCurrentDetailsActive(ref);
    setNameDetailsActive(name);
    toggleFunction(true);
  }

  console.log(currentDetailsActive);

  return (
    inventories && (
      <div id='show-inventory-container'>
        <div className="author-inventory-line show-inventory-active"
          ref={totalRef}
          onClick={() => declareActive(totalRef, 'total', setTotalInventoryOpen)}>
          <p className="author-inventory-label">Inventario total inicial</p>
          <p className="author-inventory-number">{inventories.summary.initial || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={givenRef}
          onClick={() => declareActive(givenRef, "given", setGivenToAuthorOpen)}>
          <p className="author-inventory-label">Libros entregados al autor</p>
          <p className="author-inventory-number">{inventories.summary.givenToAuthor || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={soldRef}
          onClick={() => declareActive(soldRef, "sold", setBooksSoldGraphOpen)}>
          <p className="author-inventory-label">Libros vendidos</p>
          <p className="author-inventory-number">{inventories.summary.sold || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={bookstoreRef}
          onClick={() => declareActive(bookstoreRef, "bookstore", setAuthorBookstoreInventoryOpen)}>
          <p className="author-inventory-label">Inventario en librerías</p>
          <p className="author-inventory-number">{inventories.summary.bookstores || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={wasRef}
          onClick={() => declareActive(wasRef, "was", setAuthorWasInventoryOpen)}>
          <p className="author-inventory-label">Libros en bodega Was</p>
          <p className="author-inventory-number">{inventories.summary.was || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={availableRef}
          onClick={() => declareActive(availableRef, "available", setAuthorAvailableInventoryOpen)}>
          <p className="author-inventory-label">Inventario total disponible</p>
          <p className="author-inventory-number">{inventories.summary.total || 0}</p>
        </div>
      </div>
    )
  )
}

export default ShowInventories;
