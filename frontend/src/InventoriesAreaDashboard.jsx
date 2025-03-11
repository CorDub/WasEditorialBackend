import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import UserContext from "./UserContext";

function InventoriesAreaDashboard() {
  useCheckAdmin();
  const [data, setData] = useState([]);
  const [bookstoresCount, setBookstoresCount] = useState(null);
  const { user } = useContext(UserContext);
  const [currentQuantities, setCurrentQuantities] = useState([]);

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
        setData(data[0]);
        setBookstoresCount(parseInt(data[1]));
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchInventories();
  }, []);

  useEffect(() => {
    const newArray = Array.from({length: bookstoresCount}, () => 0);
    for (const inventory of data) {
      newArray[inventory.bookstoreId - 1] += parseInt(inventory.current)
    }
    setCurrentQuantities(newArray);
  }, [data, bookstoresCount]);

  return (
    <div>
      <Navbar subNav={user.role} active={"inventories2"}/>
    </div>
  )
}

export default InventoriesAreaDashboard;
