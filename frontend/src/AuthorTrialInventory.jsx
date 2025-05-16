import { useState, useEffect } from "react";
import XAxis from "./XAxis";
import OverlappingHorizontalGraphLines from "./OverlappingHorizontalGraphLines";

function AuthorTrialInventory({selectedBookId}) {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [max, setMax] = useState(0);

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
        const data = await response.json();
        setData(data);
        const filteredData = filterData(data, 'book');
        const sorted = filteredData.sort((a, b) => b[1].initial - a[1].initial);
        setFilteredData(sorted);
        setMax(sorted[0][1].initial);
      };

    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAllAuthorInventories();
  }, []);

  function filterData(data, scope) {
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

    let results = {};
    for (const inventory of data) {
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
    setFilteredData(listResults);
    return listResults;
  }

  useEffect(() => {
    console.log(filteredData);
  }, [filteredData]);

  return(
    <div className="author-inventory-global">
      <div>
        <input type="radio" name="scope" value="book"
          onClick={() => filterData(data, "book")}></input>
        <input type="radio" name="scope" value="bookstore"
          onClick={() => filterData(data, "bookstore")}></input>
        <input type="radio" name="scope" value="country"
          onClick={() => filterData(data, "country")}></input>
      </div>
      {filteredData && filteredData.map((dataPoint, index) => (
        <OverlappingHorizontalGraphLines
          key={index}
          title={dataPoint[0]}
          initial={dataPoint[1].initial}
          sold={dataPoint[1].sold}
          given={dataPoint[1].givenToAuthor}
          max={max} />))}
      <XAxis max={max}/>
    </div>
  )
}

export default AuthorTrialInventory;
