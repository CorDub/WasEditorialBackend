import { useState, useEffect } from "react";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import ScopeSelector from "./ScopeSelector";
import "./InventoryGraph.scss";
import Legend from "./Legend";
import LoadingWheel from "./LoadingWheel";

function InventoryGraph({
    selectedBookId,
    setSelectedBookId,
    legendValues,
    legendDisplays,
    setLegendDisplays,
    exclusions}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedBookName, setSelectedBookName] = useState("");
  const [max, setMax] = useState(0);
  const [scope, setScope] = useState("book");
  const [isLoading, setLoading] = useState(false);
  const [triggerResize, setTriggerResize] = useState(false);

  async function fetchAllAuthorInventories() {
    try {
      // const cachedGraphInventoryData = sessionStorage.getItem("graphInventoryData");
      // if (cachedGraphInventoryData) {
      //   setData(JSON.parse(cachedGraphInventoryData));
      //   return
      // }

      setLoading(true);
      const response = await fetch(`${baseURL}/api/author/completeInventory`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const parsedData = await response.json();
        filterData(parsedData, scope, selectedBookId);
        // sessionStorage.setItem("graphInventoryData", JSON.stringify(parsedData));
        setData(parsedData);
        setLoading(false);
      } else {
        setLoading(false);
      }

    } catch (error) {
      console.log(error);
    }
  }
  console.log("data", data)

  // fetch all inventories with relevant data on load
  useEffect(() => {
    fetchAllAuthorInventories();
  }, []);

  function filterData(data, scope, selectedBookId, legendDisplays, exclusions) {
    if (!data) {
      return;
    }

    // defining options depending on the chosen scope
    // will fetch the correct data to groupBy later in the loop
    // created here to not recreate an object every loop
    const possibleScopes = {
      book: function(inventory) {
        return inventory.book.title;
      },
      bookstore: function(inventory) {
        return inventory.bookstore.name;
      },
      country: function(inventory) {
        return inventory.country;
      }
    }

    // first pass on filtering the data if a book is selected
    let bookFilterData;
    if (selectedBookId) {
      bookFilterData = data.filter(inventory => inventory.book.id === selectedBookId);
    } else {
      bookFilterData = data;
    }
    setSelectedBookName(bookFilterData[0].book.title);

    let results = {};
    for (const inventory of bookFilterData) {

      // making sure we skip the correct unwanted data in case of exclusions
      // first the case for everything but Was
      if (exclusions === "allButWas") {
        if (inventory.bookstore.id === 1) {
          continue;
        }
      }

      // second the case of only Was
      if (exclusions === "onlyWas") {
        if (inventory.bookstore.id !== 1) {
          continue;
        }
      }
      //get the correct groupBy with possibleScopes
      // we can now pass it an inventory for it to fetch the actual data point to groupBy
      const groupBy = possibleScopes[scope](inventory);

      // create the result objects if doesn't exist yet, add if it does
      if (groupBy in results) {
        results[groupBy].total += inventory.current + inventory.sold 
        if (inventory.bookstore.id === 1) {
          results[groupBy].total += inventory.givenToAuthor
          results[groupBy].returns += inventory.returns
          // results[groupBy].current += inventory.current - inventory.returns
          results[groupBy].current += inventory.current
        } else {
          results[groupBy].total += inventory.returns
          results[groupBy].current += inventory.current
        }

        results[groupBy].givenToAuthor += inventory.givenToAuthor
        results[groupBy].sold += inventory.sold
      } else {
        results[groupBy] = {
          name: groupBy,
          total: inventory.current + inventory.sold,
          current: inventory.current,
          givenToAuthor: inventory.givenToAuthor,
          returns: inventory.returns,
          sold: inventory.sold,
        }

        if (inventory.bookstore.id === 1) {
          results[groupBy].total += inventory.givenToAuthor
          // results[groupBy].current -= inventory.returns 
        } else {
          results[groupBy].total += inventory.returns
        }
      }
    }

    // second filtering pass based on selectedDisplays
    let generalMax = 0;
    let keyList = [];
    if (legendDisplays) {
      const legendDisplaysList = Object.entries(legendDisplays);
      for (const result of Object.entries(results)) {
        let max = 0;

        for (const display of legendDisplaysList) {
          if (display[1] === true) {
            max += result[1][display[0]];
          }
        }

        if (max > generalMax) {
          generalMax = max
        }
      }

      for (const display of Object.entries(legendDisplays)) {
        if (display[1] === true) {
          keyList.push(display[0])
        }
      }
    }

    const getSum = obj => keyList.reduce((sum, key) => sum + (obj[key] || 0), 0);

    // storing it as a list instead of an object to be able to map
    const listResults = Object.entries(results);
    if (generalMax === 0) {
      const sorted = [...listResults].sort((a, b) => b[1]["total"] - a[1]["total"]);
      setFilteredData(sorted);
      if (sorted.length > 0) {
        setMax(sorted[0][1]["total"]);
      }
    } else {
      const sorted = [...listResults].sort((a, b) => getSum(b[1]) - getSum(a[1]));
      setFilteredData(sorted);
      setMax(generalMax);
    }
  }

  useEffect(() => {
    if (selectedBookId) {
      if (scope === "book" || scope === "bookstore") {
        setScope("bookstore");
        filterData(data, "bookstore", selectedBookId, legendDisplays, exclusions);
      } else {
        setScope("country");
        filterData(data, "country", selectedBookId, legendDisplays, exclusions);
      }
    } else {
      filterData(data, scope, selectedBookId, legendDisplays, exclusions);
    }
  }, [selectedBookId, scope, data, legendDisplays, exclusions]);

  function displayScopeInTitle() {
    const title = selectedBookId === "" ? "Todos los titulos" : selectedBookName;
    switch (scope) {
      case "book":
        return `${title} por libro`;
      case "bookstore":
        return `${title} por librería`;
      case "country":
        return `${title} por país`;
    }
  }

  return(
    <div className="author-inventory-global">
      <div className="aig-scope-and-title">
        <ScopeSelector
          scope={scope}
          setScope={setScope}
          setSelectedBookId={setSelectedBookId}
          setLegendDisplays={setLegendDisplays}
          setTriggerResize={setTriggerResize}/>
        <div className="aig-title"><h2>{displayScopeInTitle()}</h2></div>
      </div>
      {isLoading && (
        <LoadingWheel />
      )}
      {filteredData && !isLoading && filteredData.map((dataPoint, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={dataPoint[0]}
          scope={scope}
          sold={legendDisplays['sold'] && dataPoint[1].sold}
          given={legendDisplays['givenToAuthor'] && dataPoint[1].givenToAuthor}
          returns={legendDisplays['returns'] && dataPoint[1].returns}
          current={legendDisplays['current'] && dataPoint[1].current}
          max={max} 
          triggerResize={triggerResize} 
          setTriggerResize={setTriggerResize}/>))}
      <Legend
        values={legendValues}
        displays={legendDisplays}
        setDisplays={setLegendDisplays}
        triggerResize={triggerResize}
        setTriggerResize={setTriggerResize}/>
    </div>
  )
}

export default InventoryGraph;
