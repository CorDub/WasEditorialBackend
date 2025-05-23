import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import BooksSoldGraph from "./BooksSoldGraph";
import './AuthorInventory.scss';
import BookSelector from "./BookSelector";
import GivenToAuthorDetails from "./GivenToAuthorDetails";
import AuthorBookstoreInventory from "./AuthorBookstoreInventory";
import AuthorWasInventory from "./AuthorWasInventory";
import AuthorAvailableInventory from "./AuthorAvailableInventory";
import AuthorInventoryGlobal from "./AuthorInventoryGlobal";
import AuthorTrialInventory from "./AuthorTrialInventory";

function AuthorInventory(){
  useCheckUser();
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [booksInventories, setBooksInventories] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);
  const [currentDetailsActive, setCurrentDetailsActive] = useState(null);
  const [nameDetailsActive, setNameDetailsActive] = useState("total");
  const [isTotalInventoryOpen, setTotalInventoryOpen] = useState(true);
  const [isGivenToAuthorOpen, setGivenToAuthorOpen] = useState(false);
  const [isBooksSoldGraphOpen, setBooksSoldGraphOpen] = useState(false);
  const [isAuthorBookstoreInventoryOpen, setAuthorBookstoreInventoryOpen] = useState(false);
  const [isAuthorWasInventoryOpen, setAuthorWasInventoryOpen] = useState(false);
  const [isAuthorAvailableInventoryOpen, setAuthorAvailableInventoryOpen] = useState(false);
  const [isAuthorTrialInventoryOpen, setAuthorTrialInventoryOpen] = useState(false);
  const [reset, setReset] = useState(false);

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
      setSelectedBookId('');
    } else {
      setShowTotal(false);
      setSelectedBookId(event.target.value);
    }
  };

  useEffect(() => {
    if (selectedBookId === "") {
      setShowTotal(true);
      setReset(true);
    }
  }, [selectedBookId]);

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
                  reset={reset}
                  setReset={setReset}
                />
              )}
          </div>

        <ShowInventories
          inventories={showTotal ? inventories : booksInventories.find(book => book.bookId === parseInt(selectedBookId))}
          currentDetailsActive={currentDetailsActive}
          nameDetailsActive={nameDetailsActive}
          setNameDetailsActive={setNameDetailsActive}
          setCurrentDetailsActive={setCurrentDetailsActive}
          setTotalInventoryOpen={setTotalInventoryOpen}
          setGivenToAuthorOpen={setGivenToAuthorOpen}
          setBooksSoldGraphOpen={setBooksSoldGraphOpen}
          setAuthorBookstoreInventoryOpen={setAuthorBookstoreInventoryOpen}
          setAuthorWasInventoryOpen={setAuthorWasInventoryOpen}
          setAuthorAvailableInventoryOpen={setAuthorAvailableInventoryOpen}
          setAuthorTrialInventoryOpen={setAuthorTrialInventoryOpen}/>
        </div>
        {isTotalInventoryOpen && (
          <AuthorInventoryGlobal
            bookSales={booksInventories}
            selectedBookId={selectedBookId} />)}
        {isGivenToAuthorOpen && (
          <GivenToAuthorDetails
            selectedBookId={selectedBookId}/>)}
        {isBooksSoldGraphOpen && (
          <BooksSoldGraph
            bookSales={booksInventories}
            selectedBookId={selectedBookId} />)}
        {isAuthorBookstoreInventoryOpen && (
          <AuthorBookstoreInventory
            selectedBookId={selectedBookId}/>)}
        {isAuthorWasInventoryOpen && (
          <AuthorWasInventory
            booksInventories={booksInventories}
            selectedBookId={selectedBookId}/>)}
        {isAuthorAvailableInventoryOpen && (
          <AuthorAvailableInventory
            bookSales={inventories.bookInventories}
            selectedBookId={selectedBookId}/>)}
        {isAuthorTrialInventoryOpen && (
          <AuthorTrialInventory
            selectedBookId={selectedBookId}
            setSelectedBookId={setSelectedBookId}/>
        )}
      </div>
    </div>
    </>
  )
}

export default AuthorInventory;
