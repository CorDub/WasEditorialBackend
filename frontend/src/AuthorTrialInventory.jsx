import { useState, useEffect } from "react";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";
import ScopeSelector from "./ScopeSelector";
import "./AuthorTrialInventory.scss";
import Legend from "./Legend";

function AuthorTrialInventory({selectedBookId, setSelectedBookId}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedBookName, setSelectedBookName] = useState("");
  const [max, setMax] = useState(0);
  const [scope, setScope] = useState("book");
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Disponibles', '#E2E2E2'],
    ['Devoluciones', 'black']
  ]
  const [legendDisplays, setLegendDisplays] = useState({
    'givenToAuthor': true,
    'sold': true,
    'current': true,
    'returns': true
  });

  useEffect(() => {
    console.log(legendDisplays);
  }, [legendDisplays])

  async function fetchAllAuthorInventories() {
    try {
      const response = await fetch(`${baseURL}/author/completeInventory`, {
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

  function filterData(data, scope, selectedBookId, legendDisplays) {
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

    // second filtering pass based on selectedDisplays
    let generalMax = 0;
    let keyList = [];
    if (legendDisplays) {
      const legendDisplaysList = Object.entries(legendDisplays);
      for (const result of Object.entries(results)) {
        let max = 0;

        for (const display of legendDisplaysList) {
          console.log("display", display)

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
      const sorted = [...listResults].sort((a, b) => b[1]["initial"] - a[1]["initial"]);
      setFilteredData(sorted);
      setMax(sorted[0][1]["initial"]);
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
        filterData(data, "bookstore", selectedBookId, legendDisplays);
      } else {
        setScope("country");
        filterData(data, "country", selectedBookId, legendDisplays);
      }
    } else {
      filterData(data, scope, selectedBookId, legendDisplays);
    }
  }, [selectedBookId, scope, data, legendDisplays]);

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

  useEffect(() => {
    console.log(filteredData);
  }, [filteredData]);

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
          initial={legendDisplays['initial'] && dataPoint[1].initial}
          sold={legendDisplays['sold'] && dataPoint[1].sold}
          given={legendDisplays['givenToAuthor'] && dataPoint[1].givenToAuthor}
          current={legendDisplays['current'] && dataPoint[1].current}
          returns={legendDisplays['returns'] && dataPoint[1].returns}
          max={max} />))}
      <Legend
        values={legendValues}
        displays={legendDisplays}
        setDisplays={setLegendDisplays}/>
    </div>
  )
}

export default AuthorTrialInventory;
