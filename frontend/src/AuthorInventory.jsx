import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState, useMemo } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import BestSellerGraph from "./BestSellerGraph";
import BookInventory from "./BookInventory";
import './AuthorInventory.css';

function AuthorInventory(){
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [books, setBooks] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);

  // Memoize the BestSellerGraph component
  const memoizedGraph = useMemo(() => {
    if (!inventories) return null;
    return <BestSellerGraph bookSales={inventories.bookSales} />;
  }, [inventories]);

  // useCheckUser(page_id);

  useEffect(()=>{
    fetchInventories()
    fetchBooks()
    setShowTotal(true);
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


  async function fetchBooks() {
    console.log(user.id)
    try {
      const response = await fetch('http://localhost:3000/author/books', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setBooks(data);
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
      {books && (
        <select onChange={handleBookChange} id="book-select">
          <option value="total">INVENTARIO TOTAL</option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
      )}
      
          <div className="author-page-content">
            {showTotal ? (
              <ShowInventories inventories={inventories} />
            ) : (
              selectedBookId && <BookInventory bookId={selectedBookId} />
            )}
            {inventories && <BestSellerGraph bookSales={inventories.bookSales} />}
          </div>
      </div>
    </>
  )
}

export default AuthorInventory;
