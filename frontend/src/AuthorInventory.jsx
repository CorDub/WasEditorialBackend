import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import BestSellerGraph from "./BestSellerGraph";
import BooksSoldGraph from "./BooksSoldGraph";
import './AuthorInventory.scss';
import BookSelector from "./BookSelector";

function AuthorInventory(){
  useCheckUser();
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [booksInventories, setBooksInventories] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);
  const [isBooksSoldGraphOpen, setBooksSoldGraphOpen] = useState(true);
  const [currentDetailsActive, setCurrentDetailsActive] = useState(null);

  useEffect(()=>{
    fetchInventories()
    setShowTotal(true);
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
    <Navbar subNav={user && user.role} active={"inventario"} />
    <div id="author-page-container">
      <div id="author-page-content">
        <div id="author-inventory-container">
          <div id="author-inventory-title-container">
            <h2 id='show-inventory-title'>Reporte de Inventario</h2>
              {booksInventories && (
                <BookSelector
                  booksInventories={booksInventories}
                  onBookChange={handleBookChange}
                />
              )}
          </div>
          {showTotal ? (
            <ShowInventories
              inventories={inventories}
              currentDetailsActive={currentDetailsActive}
              setCurrentDetailsActive={setCurrentDetailsActive}
              setBooksSoldGraphOpen={setBooksSoldGraphOpen} />
          ) : (
            selectedBookId && (
              <ShowInventories
              inventories={booksInventories.find(book => book.bookId === parseInt(selectedBookId))}
              />
            )
          )}
        </div>
        {inventories && !isBooksSoldGraphOpen && (
          <BestSellerGraph bookSales={inventories.bookInventories} /> )}
        {isBooksSoldGraphOpen && (
          <BooksSoldGraph booksSales={inventories.bookSales} />
        )}
      </div>
    </div>
    </>
  )
}

export default AuthorInventory;
