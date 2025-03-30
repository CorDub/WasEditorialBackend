import { useRef, useEffect, useState } from "react";
import "./InventoriesAreaDashboard.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

function InventoryArea({
    name,
    bookstoreName,
    count,
    top,
    left,
    height,
    width,
    setBookstoreInventoryOpen,
    setSelectedBookstore,
    setSelectedBookstoreNoSpaces,
    setSelectedLogo,
    retreat,
    setRetreat}) {
  const areaRef = useRef();
  const [logo, setLogo] = useState('');

  function setArea() {
    areaRef.current.style.top = top + 60 + "px";
    areaRef.current.style.left = left + 10 +"px";
    areaRef.current.style.height = height - 10 + "px";
    areaRef.current.style.width = width - 10 + "px";
    areaRef.current.classList.add("inventory-area-extended");
  };

  useEffect(() => {
    setArea();
    import (`./assets/${name}.png`)
      .then((image) => setLogo(image.default));
  }, [name, top, left, height, width])

  useEffect(() => {
  }, [bookstoreName, name])

  function openSelectedBookstoreInventory() {
    setRetreat(true);
    setTimeout(() => {
      setSelectedBookstore(bookstoreName);
      setSelectedBookstoreNoSpaces(name);
      setSelectedLogo(logo);
      setBookstoreInventoryOpen(true);
    }, 250)
  }

  useEffect(() => {
    if (retreat === true) {
      areaRef.current.classList.remove("inventory-area-extended");
    }
  }, [retreat])

  return (
    <div
      className="inventory-area"
      ref={areaRef}
      onClick={openSelectedBookstoreInventory}>
      <div className="inventory-logo">
        { logo ?
          <img
            src={logo}
            className='inventory-img'
            style={width < 110 ? {width: "80%"} : null}
            alt="logo de la tienda" /> :
          <div style={{display: 'flex', flexDirection:'column', marginBottom:'0.5rem'}}>
            <div className="inventory-name">{name}</div>
            <FontAwesomeIcon
              icon={faBookOpen}
              className="inventory-logo"/>
          </div>
        }
      </div>
      <div className="inventory-count">{count}</div>
    </div>
  )
}

export default InventoryArea;
