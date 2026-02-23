import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import ImpressionsList from "./ImpressionsList";
import "./InventoryTotal.scss";

function InventoryTotal({
    selectedBookstore,
    selectedBookstoreNoSpaces,
    selectedLogo,
    currentTotal,
    initialTotal,
    inTiendaTotal,
    returnsTotal,
    givenToAuthorTotal,
    soldTotal,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen,
    selectedBook,
    selectedBookId,
    setBookInventoryOpen,
    impressions,
    setModalType,
    openModal,
    setRetreat,
    preferredFontSize,
    setSpecificBookstoreOpen,
    setSpecificBookOpen}) {
  const [logo, setLogo] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [extraImpressions, setExtraImpressions] = useState(0);
  const [isImpressionsOpen, setImpressionsOpen] = useState(false);
  const [book, setBook] = useState(null);
  const [isAddingImpressionTooltipHovered, setAddingImpressionTooltipHovered] = useState(false);

  // import only the logo you need based on the name
  // useEffect(() => {
  //   import (`./assets/${selectedBookstoreNoSpaces}.png`)
  //     .then((image) => setLogo(image.default));
  // }, [selectedBookstoreNoSpaces])

  //assign name based on either bookstore name or book title
  useEffect(() => {
    if (selectedBook) {
      setName(selectedBook);
      setType("book");
      if (impressions && impressions.length > 1) {
        const extraImpressions = impressions.slice(1);
        let totalExtraImpressions = 0;
        for (const impression of extraImpressions) {
          totalExtraImpressions += impression.quantity
        }
        setExtraImpressions(totalExtraImpressions);
      }
    } else {
      setName(selectedBookstore)
      setType("bookstore");
      if (impressions && impressions > 0) {
        setExtraImpressions(impressions);
      }
    }
  }, [selectedBookstore, selectedBook, impressions])

  function returnToInventoriesAreaDashboard() {
    if (type === "book") {
      // setBookInventoryOpen(false);
      // setRetreat(false);
      setSpecificBookOpen(false);
    } else {
      setSpecificBookstoreOpen(false);
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
    <div className="total-and-impressions"
      style={{fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1rem)`}}>
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

        {impressions != null && type === "book" &&
          (<div className="bookstore-inventory-total-impressions"
            onClick={() => setImpressionsOpen(!isImpressionsOpen)}>
            <div className="adding-impression">
              <FontAwesomeIcon
                icon={faCirclePlus}
                onClick={openAddingModal}
                onMouseEnter={() => setAddingImpressionTooltipHovered(true)}
                onMouseLeave={() => setAddingImpressionTooltipHovered(false)}/>
              {isAddingImpressionTooltipHovered
                && (
                  <div className="tooltip-adding-impression">
                    Añadir impresión
                  </div>
                )}
            </div>
            <div
              className="bookstore-inventory-impressions-info">
              Impresiónes: {impressions.length}
            </div>
          </div>)}
        <div className="inventory-total-details">Inicial: {initialTotal ? initialTotal: initialTotal}</div>
        {extraImpressions > 0 &&
          <div className="inventory-total-details">Nuevas impresiones: {extraImpressions}</div>}
        {type === "bookstore" && <div className="inventory-total-details">Devueltos: {returnsTotal}</div>}
        <div className="inventory-total-details">Vendidos: {soldTotal}</div>
        {((type === "bookstore" && selectedBookstore === "WAS Editorial") || (type === "book")) &&
          (<div className="inventory-total-details">Entregados al autor: {givenToAuthorTotal}</div>)
        }
        <div className="inventory-total-details">Disponibles: {
          // initialTotal + extraImpressions - soldTotal - givenToAuthorTotal
          currentTotal
          }</div>
        <div className="bookstore-progress-return">
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
