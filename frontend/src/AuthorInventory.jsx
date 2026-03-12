import useCheckUser from "./customHooks/useCheckUser"
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import ShowInventories from "./ShowInventories";
import './AuthorInventory.scss';
import BookSelector from "./BookSelector";
import InventoryGraph from "./InventoryGraph"

function AuthorInventory(){
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [inventories, setInventories] = useState("")
  const [booksInventories, setBooksInventories] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("");
  const [showTotal, setShowTotal] = useState(false);
  const [currentDetailsActive, setCurrentDetailsActive] = useState(null);
  const [nameDetailsActive, setNameDetailsActive] = useState("total");
  const [isTotalInventoryOpen, setTotalInventoryOpen] = useState(true);
  const [reset, setReset] = useState(false);
  const [exclusions, setExclusions] = useState("");
  const legendValues = [
    ['Entregados al autor', '#57eafa'],
    ['Vendidos', '#4E5981'],
    ['Disponibles', '#E2E2E2'],
    ['Devoluciones', 'grey'],
  ]
  const [legendDisplays, setLegendDisplays] = useState({
    'givenToAuthor': true,
    'sold': true,
    'returns': false,
    'current': true
  });

  useEffect(()=>{
    fetchInventories()
    setShowTotal(true);
  },[])

  async function fetchInventories() {
    try {
      // const cachedAuthorInventoriesTotals = sessionStorage.getItem("authorInventoriesTotals");
      // const cachedAuthorBookInventoriesTotals = sessionStorage.getItem("authorBookInventoriesTotals");
      // if (cachedAuthorInventoriesTotals) {
      //   setInventories(JSON.parse(cachedAuthorInventoriesTotals));
      //   setBooksInventories(JSON.parse(cachedAuthorBookInventoriesTotals));
      //   return
      // }

      const response = await fetch(`${baseURL}/api/author/authorInventories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        // sessionStorage.setItem("authorInventoriesTotals", JSON.stringify(data));
        setInventories(data);
        // sessionStorage.setItem("authorBookInventoriesTotals", JSON.stringify(data.bookInventories));
        setBooksInventories(data.bookInventories);
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
    <div className="author-inventory"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
    <Navbar subNav={user && user.role} active={"inventario"} />
    <div id="author-page-container">
      <div id="author-page-content">
        <div id="author-inventory-container">
          <div id="author-inventory-title-container">
            <h2 id='show-inventory-title'>Reporte de Inventario Físico</h2>
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
          legendDisplays={legendDisplays}
          setLegendDisplays={setLegendDisplays}
          exclusions={exclusions}
          setExclusions={setExclusions}
          showTotal={showTotal}/>
        </div>
        <div className="author-inventory-rightfield">
          {isTotalInventoryOpen && (
            <InventoryGraph
              selectedBookId={selectedBookId}
              setSelectedBookId={setSelectedBookId}
              legendValues={legendValues}
              legendDisplays={legendDisplays}
              setLegendDisplays={setLegendDisplays}
              exclusions={exclusions}/>)}
        </div>
      </div>
    </div>
    </div>
  )
}

export default AuthorInventory;
