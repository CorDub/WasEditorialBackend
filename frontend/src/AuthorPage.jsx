import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventory";
import BestSellerGraph from "./BestSellerGraph";
import './AuthorPage.css';

function AuthorPage() {
  const { user } = useContext(UserContext);
  const params = useParams();
  const [inventories, setInventories] = useState("")

  useEffect(()=>{
    fetchInventories()
    console.log(inventories)
  },[])

  async function fetchInventories() {
    try {
      const response = await fetch('http://localhost:3000/author', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched inventory data:", data);
        console.log("Book sales data:", data.bookSales);
        setInventories(data);
      }
    } catch (error) {
      console.error(error);
    }
  }



  return (
    <div id="author-page-container">
      <Navbar subNav={user.role} active={"autores"}/>
      <h1 id="author-page-title">Inventario</h1>
      {inventories && (
        <div className="author-page-content">
          <ShowInventories inventories={inventories}/>
          <BestSellerGraph bookSales={inventories.bookSales} />
        </div>
      )}
    </div>
  )
};

export default AuthorPage;
