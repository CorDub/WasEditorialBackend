import { useState, useEffect } from "react";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import ScopeSelector from "./ScopeSelector";
import "./AuthorTrialInventory.scss";
import Legend from "./Legend";

function AuthorTrialInventory({selectedBookId, setSelectedBookId}) {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedBookName, setSelectedBookName] = useState("");
  const [max, setMax] = useState(0);
  const [scope, setScope] = useState("book");
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Disponibles', '#E2E2E2'],
  ]
  const [legendDisplays, setLegendDisplays] = useState({
    'Entregados al autor': true,
    'Vendidos': true,
    'Disponibles': true
  });

  async function fetchAllAuthorInventories() {
    try {
      const response = await fetch("http://localhost:3000/author/completeInventory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const parsedData = await response.json();
        filterData(parsedData, scope, selectedBookId);
        setData(parsedData);
      };

    } catch (error) {
      console.log(error);
    }
  }

  // fetch all inventories with relevant data on load
  useEffect(() => {
    fetchAllAuthorInventories();
  }, []);

  function filterData(data, scope, selectedBookId) {
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
      //get the correct groupBy with possibleScopes
      // we can now pass it an inventory for it to fetch the actual data point to groupBy
      const groupBy = possibleScopes[scope](inventory);

      // getting the sales total first for this inventory,
      // as we'll add it either way
      let sumSales = 0;
      for (const sale of inventory.sales) {
        if (!sale.isDeleted) {
          sumSales += sale.quantity
        }
      }

      // create the result objects if doesn't exist yet, add if it does
      if (groupBy in results) {
        results[groupBy].initial += inventory.initial
        results[groupBy].current += inventory.current
        results[groupBy].givenToAuthor += inventory.givenToAuthor
        results[groupBy].returns += inventory.returns
        results[groupBy].sold += sumSales
      } else {
        results[groupBy] = {
          name: groupBy,
          initial: inventory.initial,
          current: inventory.current,
          givenToAuthor: inventory.givenToAuthor,
          returns: inventory.returns,
          sold: sumSales
        }
      }
    }

    // storing it as a list instead of an object to be able to map
    const listResults = Object.entries(results);
    const sorted = listResults.sort((a, b) => b[1].initial - a[1].initial);
    setFilteredData(sorted);
    setMax(sorted[0][1].initial);
  }

  useEffect(() => {
    if (selectedBookId) {
      if (scope === "book" || scope === "bookstore") {
        setScope("bookstore");
        filterData(data, "bookstore", selectedBookId);
      } else {
        setScope("country");
        filterData(data, "country", selectedBookId);
      }
    } else {
      filterData(data, scope, selectedBookId);
    }
  }, [selectedBookId, scope, data]);

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

  // useEffect(() => {
  //   console.log(filteredData);
  // }, [filteredData]);

  return(
    <div className="author-inventory-global">
      <div className="aig-scope-and-title">
        <ScopeSelector
          scope={scope}
          setScope={setScope}
          setSelectedBookId={setSelectedBookId}/>
        <div className="aig-title"><h2>{displayScopeInTitle()}</h2></div>
      </div>
      {filteredData && filteredData.map((dataPoint, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={dataPoint[0]}
          initial={legendDisplays['Disponibles'] && dataPoint[1].initial}
          sold={legendDisplays['Vendidos'] && dataPoint[1].sold}
          given={legendDisplays['Entregados al autor'] && dataPoint[1].givenToAuthor}
          max={max} />))}
      {/* <XAxis max={max}/> */}
      <Legend
        values={legendValues}
        displays={legendDisplays}
        setDisplays={setLegendDisplays}/>
    </div>
  )
}

export default AuthorTrialInventory;
