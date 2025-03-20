import { useContext, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import useCheckAdmin from './customHooks/useCheckAdmin';
import InventoriesContext from "./InventoriesContext";

function BookstoreInventory() {
  useCheckAdmin();
  const location = useLocation();
  const { inventories } = useContext(InventoriesContext);
  const [relevantInventories, setRelevantInventories] = useState([]);

  useEffect(() => {
    selectRelevantInventories();
  }, [inventories])

  function selectRelevantInventories() {
    const relevantInventories = [];
    for (const inventory of inventories) {
      if (inventory.bookstore.name === location.state.name) {
        relevantInventories.push(inventory)
      }
    }
    setRelevantInventories(relevantInventories);
  }

  function sortRelevantInventories() {
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    console.log(sortedRelevantInventories);
    setRelevantInventories(sortedRelevantInventories);
  }

  useEffect(() => {
    sortRelevantInventories()
  }, [relevantInventories])

  return (
    <div className="bookstore-inventory">
      yes this is bookstore inventory for bookstore {location && location.state.name}
    </div>
  )
}

export default BookstoreInventory;
