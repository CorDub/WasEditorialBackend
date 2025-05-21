import { useState, useEffect } from "react";
import InventoriesContext from "./InventoriesContext";

function InventoriesProvider({ children }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [inventories, setInventories] = useState("");

  async function fetchInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventories`, {
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
