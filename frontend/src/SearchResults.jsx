import { useRef, useEffect } from "react";
import "./SearchResults.scss";

function SearchResults({searchResults, searchBarRef}) {
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

  return (
    <div
      className="search-results"
      ref={searchResultsRef}>
      {searchResults.map((result, index)=> {
        return (
          <div
            key={index}
            className="result">
            <p>{result}</p>
          </div>
        )
      })}
    </div>
  )
}

export default SearchResults;
