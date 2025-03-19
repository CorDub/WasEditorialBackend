import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import BestSellerGraph from "./BestSellerGraph";
import './AuthorInventory.css';

function AuthorInventory(){
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [booksInventories, setBooksInventories] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);

  useEffect(()=>{
    fetchInventories()
    setShowTotal(true);
    console.log(inventories)
  },[])

  async function fetchInventories() {
    try {
      const response = await fetch('http://localhost:3000/author/inventories', {
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
        setBooksInventories(data.bookInventories)
      }
    } catch (error) {
      console.error(error);
    }
  }


  const handleBookChange = (event) => {
    if (event.target.value === "total") {
      setShowTotal(true);
      setSelectedBookId(null);
    } else {
      setShowTotal(false);
      setSelectedBookId(event.target.value);
    }
  };

  return (
    <>
    <Navbar subNav={user.role} active={"autores"} />
    <div id="author-page-container">
      <h1 id="author-page-title">Inventario</h1>
      {booksInventories && (
        <select onChange={handleBookChange} id="book-select">
          <option value="total">INVENTARIO TOTAL</option>
          {booksInventories.map((bookInventory) => (
            <option key={bookInventory.bookId} value={bookInventory.bookId}>
              {bookInventory.title}
            </option>
          ))}
        </select>
      )}
      
      <div className="author-page-content">
        {showTotal ? (
          <ShowInventories inventories={inventories} />
        ) : (
          selectedBookId && (
            <ShowInventories 
              inventories={booksInventories.find(book => book.bookId === parseInt(selectedBookId))} 
            />
          )
        )}
        {inventories && <BestSellerGraph bookSales={inventories.bookInventories} />}
      </div>
    </div>
    </>
  )
}

export default AuthorInventory;
