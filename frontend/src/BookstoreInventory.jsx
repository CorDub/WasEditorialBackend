import { useContext, useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import useCheckAdmin from './customHooks/useCheckAdmin';
import InventoriesContext from "./InventoriesContext";
import "./BookstoreInventory.scss";

function BookstoreInventory({selectedBookstore}) {
  useCheckAdmin();
  const location = useLocation();
  const { inventories } = useContext(InventoriesContext);
  const [relevantInventories, setRelevantInventories] = useState([]);
  const bookstoreInventoryRef = useRef()

  useEffect(() => {
    selectRelevantInventories();
  }, [inventories])

  function selectRelevantInventories() {
    const relevantInventories = [];
    for (const inventory of inventories) {
      if (inventory.bookstore.name === selectedBookstore) {
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

  useEffect(() => {
    
    requestAnimationFrame(() => {
      bookstoreInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBookstore])

  return (
    <div
      className="bookstore-inventory"
      ref={bookstoreInventoryRef}>
      yes this is bookstore inventory for bookstore {selectedBookstore && selectedBookstore}
    </div>
  )
}

export default BookstoreInventory;
