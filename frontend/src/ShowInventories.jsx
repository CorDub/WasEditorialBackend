import './ShowInventories.scss';
import { useRef, useEffect, useState } from "react";
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
    setAuthorAvailableInventoryOpen,
    setAuthorTrialInventoryOpen,
    legendDisplays,
    setLegendDisplays,
    setExclusions}) {
  useCheckUser();
  const totalRef = useRef();
  const givenRef = useRef();
  const soldRef = useRef();
  const bookstoreRef = useRef();
  const wasRef = useRef();
  const availableRef = useRef();
  const trialRef = useRef();
  const [isWasPerCountryOpen, setWasPerCountryOpen] = useState(false);

  //ensure that totalRef is the default so that something is displayed
  useEffect(() => {
    if (currentDetailsActive === null) {
      setCurrentDetailsActive(totalRef);
    }
  }, [currentDetailsActive])

  function declareActive(ref, name, toggleFunction) {
    // highlight clicked detail, open corresponding component and close previous one
    if (ref === currentDetailsActive) {
      return;
    };

    const toggleFunctions = {
      total: setTotalInventoryOpen,
      given: setGivenToAuthorOpen,
      sold: setBooksSoldGraphOpen,
      bookstore: setAuthorBookstoreInventoryOpen,
      was: setAuthorWasInventoryOpen,
      available: setAuthorAvailableInventoryOpen,
      trial: setAuthorTrialInventoryOpen
    }

    // removing and adding the active style to the right components.
    currentDetailsActive.current.classList.remove("show-inventory-active");
    ref.current.classList.add("show-inventory-active");
    // not removing the authorTrialInventory unless it's was, cause was is a special case
    if (nameDetailsActive === "total") {
      if (name === "was") {
        toggleFunctions[nameDetailsActive](false);
      }
    } else {
        toggleFunctions[nameDetailsActive](false);
    }

    modifyInteractiveGraphDisplays(name);
    setCurrentDetailsActive(ref);
    setNameDetailsActive(name);
    if (name === "total"
      || name === "given"
    ) {
      toggleFunction(true);
    }
    setWasPerCountryOpen(false);
  }

  function modifyInteractiveGraphDisplays(name) {
    const options = {
      total: {
        'givenToAuthor': true,
        'sold': true,
        'current': true,
        'returns': true
      },
      given: {
        'givenToAuthor': true,
        'sold': false,
        'current': false,
        'returns': false
      },
      sold: {
        'givenToAuthor': false,
        'sold': true,
        'current': false,
        'returns': false
      },
      bookstore: {
        'givenToAuthor': false,
        'sold': false,
        'current': true,
        'returns': false
      },
      was: {
        'givenToAuthor': false,
        'sold': false,
        'current': true,
        'returns': false
      },
      available: {
        'givenToAuthor': false,
        'sold': false,
        'current': true,
        'returns': false
      },
    }

    setLegendDisplays(options[name]);
  }

  return (
    inventories && (
      <div id='show-inventory-container'>
        <div className="author-inventory-line show-inventory-active"
          ref={totalRef}
          onClick={() => {
            declareActive(totalRef, 'total', setTotalInventoryOpen),
            setExclusions("")}}>
          <p className="author-inventory-label">Inventario total inicial</p>
          <p className="author-inventory-number">{inventories.summary.initial || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={givenRef}
          onClick={() => {
            declareActive(givenRef, "given", setGivenToAuthorOpen),
            setExclusions("")}}>
          <p className="author-inventory-label">Libros entregados al autor</p>
          <p className="author-inventory-number">{inventories.summary.givenToAuthor || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={soldRef}
          onClick={() => {
            declareActive(soldRef, "sold", setBooksSoldGraphOpen),
            setExclusions("")}}>
          <p className="author-inventory-label">Libros vendidos</p>
          <p className="author-inventory-number">{inventories.summary.sold || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={bookstoreRef}
          onClick={() => {
            declareActive(bookstoreRef, "bookstore", setAuthorBookstoreInventoryOpen),
            setExclusions('allButWas')}}>
          <p className="author-inventory-label">Inventario en librerías</p>
          <p className="author-inventory-number">{inventories.summary.bookstores || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={wasRef}
          onClick={() => {
            declareActive(wasRef, "was", setAuthorWasInventoryOpen)
            setWasPerCountryOpen(!isWasPerCountryOpen)
            setExclusions("onlyWas")}}>
          <p className="author-inventory-label">Libros en bodega Was</p>
          <p className="author-inventory-number">{inventories.summary.was || 0}</p>
        </div>
        {isWasPerCountryOpen && Object.entries(inventories.summary.wasPerCountry).map((country, index) => (
          <div
            className="author-inventory-was"
            key={index}>
            <p className="author-inventory-was-country">{country[0]}</p>
            <p className="author-inventory-was-number">{country[1]}</p>
          </div>
        ))}
        <div className="author-inventory-line"
          ref={availableRef}
          onClick={() => {
            declareActive(availableRef, "available", setAuthorAvailableInventoryOpen)
            setExclusions("")}}>
          <p className="author-inventory-label">Inventario total disponible</p>
          <p className="author-inventory-number">{inventories.summary.total || 0}</p>
        </div>
      </div>
    )
  )
}

export default ShowInventories;
