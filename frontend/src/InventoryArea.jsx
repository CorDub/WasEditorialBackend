import { useRef, useEffect, useState } from "react";
import "./InventoriesAreaDashboard.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faBookOpen} from '@fortawesome/free-solid-svg-icons';

function InventoryArea({name, count, top, left, height, width}) {
  const areaRef = useRef();
  const [logo, setLogo] = useState('');

  function setArea() {
    areaRef.current.style.top = top + 60 + "px";
    areaRef.current.style.left = left + 10 +"px";
    areaRef.current.style.height = height - 10 + "px";
    areaRef.current.style.width = width - 10 + "px";
  };

  useEffect(() => {
    setArea();
    import (`./assets/${name}.png`)
      .then((image) => setLogo(image.default));
  }, [name, top, left, height, width])

  console.log(name, logo);

  return (
    <div className="inventory-area" ref={areaRef}>

      <div className="inventory-logo">
        { logo ?
          <img
            src={logo}
            className='inventory-img'
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
