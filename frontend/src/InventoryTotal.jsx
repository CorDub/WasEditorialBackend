import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import ImpressionsList from "./ImpressionsList";

function InventoryTotal({
    selectedBookstore,
    selectedBookstoreNoSpaces,
    selectedLogo,
    currentTotal,
    initialTotal,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen,
    selectedBook,
    selectedBookId,
    setBookInventoryOpen,
    impressions,
    setModalType,
    openModal}) {
  const [logo, setLogo] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [isImpressionsOpen, setImpressionsOpen] = useState(false);
  const [book, setBook] = useState(null);

  // import only the logo you need based on the name
  useEffect(() => {
    import (`./assets/${selectedBookstoreNoSpaces}.png`)
      .then((image) => setLogo(image.default));
  }, [selectedBookstoreNoSpaces])

  //assign name based on either bookstore name or book title
  useEffect(() => {
    if (selectedBook) {
      setName(selectedBook);
      setType("book");
    } else {
      setName(selectedBookstore)
      setType("bookstore");
    }
  }, [selectedBookstore, selectedBook])

  function returnToInventoriesAreaDashboard() {
    if (type === "book") {
      setBookInventoryOpen(false);
    } else {
      setBookstoreInventoryOpen(false);
    }
  }

  useEffect(() => {
    setBook({book: selectedBook, id: selectedBookId});
  }, [selectedBook, selectedBookId])

  function openAddingModal() {
    setModalType('impression');
    openModal("adding", book);
  };

  return(
    <div className="total-and-impressions">
      <div className="bookstore-inventory-total">

        {logo ?
          <img src={logo} className="bookstore-inventory-img"/> :
          <div style={{display: 'flex', marginLeft:'0.5rem', alignItems: "center"}}>
            <FontAwesomeIcon
              icon={type === "book" ? faBookOpen : faStore}
              className="inventory-logo"/>
            <div
              className="inventory-name"
              style={{marginLeft: "0.5rem", marginBottom: "0"}}>{name}</div>
          </div>
        }

        {impressions &&
          <div className="bookstore-inventory-total-impressions">
            <div className="adding-impression">
              <FontAwesomeIcon
                icon={faCirclePlus}
                onClick={openAddingModal}/>
            </div>
            <div
              className="bookstore-inventory-impressions-info"
              onClick={() => setImpressionsOpen(!isImpressionsOpen)}>
              Impressiones: {impressions.length}
            </div>
          </div>}

        <div>Total vendidos: {initialTotal - currentTotal} / {initialTotal}</div>
        <div>Total disponibles: {currentTotal} / {initialTotal}</div>
        <div className="bookstore-progress-return">
          <ProgressBar current={currentTotal} initial={initialTotal} />
          <FontAwesomeIcon
            icon={faCircleXmark}
            className="inventory-back-button"
            onClick={returnToInventoriesAreaDashboard}/>
        </div>
      </div>
      <div className="inventory-total-impressions">
        {isImpressionsOpen &&
          <ImpressionsList
            impressions={impressions}
            setModalType={setModalType}
            openModal={openModal}
            book={book}/>}
      </div>
    </div>
  )
}

export default InventoryTotal;
