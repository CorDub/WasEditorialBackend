import "./ScopeSelector.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faShop, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'
import { useEffect } from "react";

function ScopeSelector({scope, setScope}) {
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
        onClick={() => setScope("book")} />
      <FontAwesomeIcon
        icon={faShop}
        className={scope === "bookstore" ? "ssi-active" : "scope-selector-icon"}
        onClick={() => setScope("bookstore")} />
      <FontAwesomeIcon
        icon={faEarthAmericas}
        className={scope === "country" ? "ssi-active" : "scope-selector-icon"}
        onClick={() => setScope("country")} />
      <div
        className="scope-selector-slider"
        style={{ left: `${determineLeft()}`}}></div>
    </div>
  )
}

export default ScopeSelector;
