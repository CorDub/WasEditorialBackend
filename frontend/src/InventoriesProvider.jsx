import { useState, useEffect } from "react";
import InventoriesContext from "./InventoriesContext";

function InventoriesProvider({ children }) {
  const [inventories, setInventories] = useState("");

  async function fetchInventories() {
    try {
      const response = await fetch('http://localhost:3000/admin/inventories', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setInventories(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchInventories()
  }, []);

  return (
    <InventoriesContext.Provider value={{ inventories, fetchInventories }}>
      {children}
    </InventoriesContext.Provider>
  )
}

export default InventoriesProvider
