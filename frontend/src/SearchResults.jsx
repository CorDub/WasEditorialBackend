import { useRef, useEffect, useState } from "react";
import "./SearchResults.scss";

function SearchResults({
  searchResults,
  searchBarRef,
  setBookstoreInventoryOpen,
  setSelectedBookstore,
  setSelectedBook,
  setBookInventoryOpen,
  retreat,
  setRetreat,
  setSearchTerms}) {
  const searchResultsRef = useRef();

  function determineSearchResultsPosition() {
    const searchBarRefPosition = searchBarRef.current.getBoundingClientRect()
    searchResultsRef.current.style.top = searchBarRefPosition.bottom + 15 + "px"
    searchResultsRef.current.style.left = searchBarRefPosition.left + "px"
    searchResultsRef.current.style.minWidth = searchBarRefPosition.width + "px"
  }

  useEffect(() => {
    determineSearchResultsPosition();
  }, [searchResults]);

  function openSelectedInventory(name, type) {
    setBookInventoryOpen(false);
    setBookstoreInventoryOpen(false);
    setSearchTerms("");
    setRetreat(true);
    setTimeout(() => {
      if (type === "bookstore") {
        setSelectedBookstore(name);
        setBookstoreInventoryOpen(true);
      } else {
        setSelectedBook(name);
        setBookInventoryOpen(true);
      }
    }, 250)
  }

  return (
    <div
      className="search-results"
      ref={searchResultsRef}>
      {searchResults.map((result, index)=> {
        return (
          <div
            key={index}
            className="result">
            <p
              className="result-link"
              onClick={() => openSelectedInventory(result.name, result.type)}
              >{result.name}</p>
          </div>
        )
      })}
    </div>
  )
}

export default SearchResults;
