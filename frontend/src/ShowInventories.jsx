import './ShowInventories.scss';
import { useRef, useEffect, useState } from "react";
import useCheckUser from './customHooks/useCheckUser';
import { changeDateFormat } from '../../backend/utils';

function ShowInventories({
    inventories,
    currentDetailsActive,
    nameDetailsActive,
    setNameDetailsActive,
    setCurrentDetailsActive,
    setTotalInventoryOpen,
    // setGivenToAuthorOpen,
    // setBooksSoldGraphOpen,
    // setAuthorBookstoreInventoryOpen,
    // setAuthorWasInventoryOpen,
    // setAuthorAvailableInventoryOpen,
    legendDisplays,
    setLegendDisplays,
    setExclusions,
    showTotal
  }) {
  useCheckUser();
  const totalRef = useRef();
  const givenRef = useRef();
  const soldRef = useRef();
  const bookstoreRef = useRef();
  const wasRef = useRef();
  const availableRef = useRef();
  // const trialRef = useRef();
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
      // given: setGivenToAuthorOpen,
      // sold: setBooksSoldGraphOpen,
      // bookstore: setAuthorBookstoreInventoryOpen,
      // was: setAuthorWasInventoryOpen,
      // available: setAuthorAvailableInventoryOpen,
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

  console.log("inventories", inventories)

  return (
    inventories && (
      <div id='show-inventory-container'>
        <div className="author-inventory-kindle-disclaimer">Este reporte no contiene datos de ventas en Kindle</div>
        <div className="author-inventory-line"
          ref={totalRef}
          // onClick={() => {
          //   declareActive(totalRef, 'total', setTotalInventoryOpen),
          //   setExclusions("")}}
          >
          <p className="author-inventory-label">Inventario total inicial 
            {!showTotal && (
              <span className="author-inventory-date">{changeDateFormat(inventories.impressions[0].dateStr, "dayFirst") || ""}</span>
            )}
          </p>
          {/* {!showTotal && (
            <p className="author-inventory-date">{convertISOString(inventories.impressions[0].date) || ""}</p>
          )} */}
          <p className="author-inventory-number">{inventories.summary.initial || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={totalRef}
          // onClick={() => {
          //   declareActive(totalRef, 'total', setTotalInventoryOpen),
          //   setExclusions("")}}
          >
          <p className="author-inventory-label">Nuevas impresiones</p>
          <p className="author-inventory-number">{inventories.summary.impressions || 0}</p>
        </div>
        {!showTotal && 
            inventories.impressions &&
            inventories.impressions.length > 1 && (
            <>
              {inventories.impressions && inventories.impressions.map((impression, index) => {
                if (index !== 0) {
                  return (
                    <div key={index} className="author-inventory-impressions">
                      {/* <p className="author-inventory-date">({convertISOString(impression.date)})</p> */}
                      <p className="author-inventory-date">{changeDateFormat(impression.dateStr, "dayFirst")}</p>
                      <p className="author-inventory-date">{impression.quantity}</p>
                    </div>
                  )
                } 
              })}
            </>
          )}
        <div className="author-inventory-line ail-bold">
          <p className="author-inventory-label">Copias impresas totales</p>
          <p className="author-inventory-label">{(inventories.summary.impressions + inventories.summary.initial) || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={givenRef}
          // onClick={() => {
          //   declareActive(givenRef, "given", setGivenToAuthorOpen),
          //   setExclusions("")}}
          >
          <p className="author-inventory-label">Libros entregados al autor</p>
          <p className="author-inventory-number">{inventories.summary.givenToAuthor || 0}</p>
        </div>
        <div className="author-inventory-line"
          ref={soldRef}
          // onClick={() => {
          //   declareActive(soldRef, "sold", setBooksSoldGraphOpen),
          //   setExclusions("")}}
          >
          <p className="author-inventory-label">Libros vendidos</p>
          <p className="author-inventory-number">{inventories.summary.sold || 0}</p>
        </div>
        
        <div className="author-inventory-line ail-bold"
          ref={availableRef}
          // onClick={() => {
          //   declareActive(availableRef, "available", setAuthorAvailableInventoryOpen)
          //   setExclusions("")}}
          >
          <p className="author-inventory-label" title='Inventario total disponible'>Inventario total disponible</p>
          <p className="author-inventory-number">{inventories.summary.total || 0}</p>
        </div>

        
        <div className="author-inventory-line ail-repartition"
          ref={wasRef}
          // onClick={() => {
          //   declareActive(wasRef, "was", setAuthorWasInventoryOpen)
          //   setWasPerCountryOpen(!isWasPerCountryOpen)
          //   setExclusions("onlyWas")}}
          >
          <p className="author-inventory-label">Libros disponibles en bodega Was</p>
          <p className="author-inventory-number">{inventories.summary.was || 0}</p>
        </div>
        <div className="author-inventory-line ail-repartition"
          ref={bookstoreRef}
          // onClick={() => {
          //   declareActive(bookstoreRef, "bookstore", setAuthorBookstoreInventoryOpen),
          //   setExclusions('allButWas')}}
          >
          <p className="author-inventory-label">Inventario disponible en librerías</p>
          <p className="author-inventory-number">{inventories.summary.bookstores || 0}</p>
        </div>
        {isWasPerCountryOpen && Object.entries(inventories.summary.wasPerCountry).map((country, index) => (
          <div
            className="author-inventory-was"
            key={index}>
            <p className="author-inventory-was-country">{country[0]}</p>
            <p className="author-inventory-was-number">{country[1]}</p>
          </div>
        ))}
      </div>
    )
  )
}

export default ShowInventories;
