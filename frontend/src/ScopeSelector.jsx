import "./ScopeSelector.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faShop, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'
import { useState } from "react";

function ScopeSelector({scope, setScope}) {
  const [isBookTooltipOpen, setBookTooltipOpen] = useState(false);
  const [isBookstoreTooltipOpen, setBookstoreTooltipOpen] = useState(false);
  const [isCountryTooltipOpen, setCountryTooltipOpen] = useState(false);

  function determineLeft() {
    switch (scope) {
      case "book":
        return "3px";
      case "bookstore":
        return "34px";
      case "country":
        return "67px";
    }
  }

  return(
    <div className="scope-selector">
      <FontAwesomeIcon
        icon={faBook}
        className={scope === "book" ? "ssi-active" : "scope-selector-icon"}
        onClick={() => setScope("book")}
        onMouseEnter={() => setBookTooltipOpen(true)}
        onMouseLeave={() => setBookTooltipOpen(false)} />
      {isBookTooltipOpen && (
        <div className="scope-selector-tooltip-libro">Libro</div>)}
      <FontAwesomeIcon
        icon={faShop}
        className={scope === "bookstore" ? "ssi-active" : "scope-selector-icon"}
        onClick={() => setScope("bookstore")}
        onMouseEnter={() => setBookstoreTooltipOpen(true)}
        onMouseLeave={() => setBookstoreTooltipOpen(false)} />
      {isBookstoreTooltipOpen && (
        <div className="scope-selector-tooltip-libreria">Librería</div>)}
      <FontAwesomeIcon
        icon={faEarthAmericas}
        className={scope === "country" ? "ssi-active" : "scope-selector-icon"}
        onClick={() => setScope("country")}
        onMouseEnter={() => setCountryTooltipOpen(true)}
        onMouseLeave={() => setCountryTooltipOpen(false)} />
      {isCountryTooltipOpen && (
        <div className="scope-selector-tooltip-pais">País</div>)}
      <div
        className="scope-selector-slider"
        style={{ left: `${determineLeft()}`}}></div>
    </div>
  )
}

export default ScopeSelector;
