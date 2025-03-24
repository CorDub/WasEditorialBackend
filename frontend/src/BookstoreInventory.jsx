import { useContext, useState, useEffect, useRef } from "react";
import useCheckAdmin from './customHooks/useCheckAdmin';
import InventoriesContext from "./InventoriesContext";
import "./BookstoreInventory.scss";
import BookstoreInventoryBook from "./BookstoreInventoryBook";
import BookstoreInventoryTotal from "./BookstoreInventoryTotal";

function BookstoreInventory({selectedBookstore, selectedLogo}) {
  useCheckAdmin();
  const { inventories } = useContext(InventoriesContext);
  const [relevantInventories, setRelevantInventories] = useState([]);
  const bookstoreInventoryRef = useRef()
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);

  useEffect(() => {
    selectRelevantInventories();
  }, [inventories])

  function selectRelevantInventories() {
    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    for (const inventory of inventories) {
      if (inventory.bookstore.name === selectedBookstore) {
        relevantInventories.push(inventory);
        currentTotal += inventory.current;
        initialTotal += inventory.initial;
      }
    }
    setCurrentTotal(currentTotal);
    setInitialTotal(initialTotal);
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    setRelevantInventories(sortedRelevantInventories);
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      bookstoreInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBookstore])

  return (
    <div
      className="bookstore-inventory"
      ref={bookstoreInventoryRef}>
      <BookstoreInventoryTotal
        selectedBookstore={selectedBookstore}
        selectedLogo={selectedLogo}
        currentTotal={currentTotal}
        initialTotal={initialTotal}/>
      {relevantInventories.map((inventory, index) => {
        return (
          <BookstoreInventoryBook
            key={index}
            title={inventory.book.title}
            current={inventory.current}
            initial={inventory.initial}/>
        )
      })

      }
    </div>
  )
}

export default BookstoreInventory;
