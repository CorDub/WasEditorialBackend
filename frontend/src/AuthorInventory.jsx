import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import BestSellerGraph from "./BestSellerGraph";
import './AuthorInventory.scss';
import BookSelector from "./BookSelector";

function AuthorInventory(){
  useCheckUser();
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [booksInventories, setBooksInventories] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);

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
        console.log("Fetched inventory data:", data);
        console.log("Book sales data:", data.bookSales);
        setInventories(data);
        setBooksInventories(data.bookInventories)
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    console.log(booksInventories)
  }, [booksInventories])

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
            <ShowInventories inventories={inventories} />
          ) : (
            selectedBookId && (
              <ShowInventories
              inventories={booksInventories.find(book => book.bookId === parseInt(selectedBookId))}
              />
            )
          )}
        </div>
        {inventories && <BestSellerGraph bookSales={inventories.bookInventories} />}
      </div>
    </div>
    </>
  )
}

export default AuthorInventory;
