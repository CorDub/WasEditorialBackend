import "./ScopeSelector.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faShop, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'
import { useState } from "react";

function ScopeSelector({scope, setScope, setSelectedBookId, setLegendDisplays}) {
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
        return "66px";
    }
  }

  return(
    <div className="scope-selector">
      <FontAwesomeIcon
        icon={faBook}
        className={scope === "book" ? "ssi-active fa-icon" : "scope-selector-icon fa-icon"}
        onClick={() => {
          setScope("book");
          setSelectedBookId('');
          setLegendDisplays({
            "givenToAuthor": true,
            "sold": true,
            "current": true,
            "returns": true
          })
        }}
        onMouseEnter={() => setBookTooltipOpen(true)}
        onMouseLeave={() => setBookTooltipOpen(false)} />
      {isBookTooltipOpen && (
        <div className="scope-selector-tooltip-libro">Libro</div>)}
      <FontAwesomeIcon
        icon={faShop}
        className={scope === "bookstore" ? "ssi-active fa-icon" : "scope-selector-icon fa-icon"}
        id='ssi-bookstore'
        onClick={() => {
          setScope("bookstore")
          setLegendDisplays({
            "givenToAuthor": true,
            "sold": true,
            "current": true,
            "returns": true
          })}}
        onMouseEnter={() => setBookstoreTooltipOpen(true)}
        onMouseLeave={() => setBookstoreTooltipOpen(false)} />
      {isBookstoreTooltipOpen && (
        <div className="scope-selector-tooltip-libreria">Librería</div>)}
      <FontAwesomeIcon
        icon={faEarthAmericas}
        className={scope === "country" ? "ssi-active fa-icon" : "scope-selector-icon fa-icon"}
        onClick={() => {
          setScope("country")
          setLegendDisplays({
            "givenToAuthor": true,
            "sold": true,
            "current": true,
            "returns": true
          })}}
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
