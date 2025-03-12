import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import UserContext from "./UserContext";
import "./InventoriesAreaDashboard.scss"
import InventoryArea from "./InventoryArea";

function InventoriesAreaDashboard() {
  useCheckAdmin();
  const [data, setData] = useState([]);
  const [bookstoresCount, setBookstoresCount] = useState(null);
  const { user } = useContext(UserContext);
  const [currentQuantities, setCurrentQuantities] = useState([]);
  const [viewportHeight, setViewportHeight] = useState(document.documentElement.clientHeight);
  const [viewportWidth, setViewportWidth] = useState(document.documentElement.clientHeight);
  const [areaDimensions, setAreaDimensions] = useState([]);

  useEffect(() => {
    function handleResize() {
      setViewportHeight(document.documentElement.clientHeight);
      setViewportWidth(document.documentElement.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function splitAreas() {
    //get max available width and height
    // const computedStyle = window.getComputedStyle(containerRef.current);
    // const available_height_str = computedStyle.height;
    // const available_height = parseInt(available_height_str.replace("px", ""));
    // const available_width = parseInt(computedStyle.width.replace("px", ""));
    const available_height = viewportHeight - 70;
    const available_width = viewportWidth - 10;

    const totalArea = available_height * available_width

    //get percentages split
    let totalCurrentQuantities = 0
    for (const quantity of currentQuantities) {
      totalCurrentQuantities += quantity
    }

    const areaPercentages = Array.from({length: bookstoresCount}).fill(0);
    for (let i = 0; i < currentQuantities.length; i++ ) {
      areaPercentages[i] = Math.round((currentQuantities[i] / totalCurrentQuantities) * 100);
    }
    let totalAreaPercentage = 0
    for (const percent of areaPercentages) {
      totalAreaPercentage += percent;
    }
    if (totalAreaPercentage < 100) {
      areaPercentages[0] += 100 - totalAreaPercentage;
    } else if (totalAreaPercentage > 100) {
      areaPercentages[0] -= totalAreaPercentage - 100;
    }

    const areaPixels = Array.from({length: bookstoresCount}).fill(0);
    areaPixels.sort((a,b) => b - a);

    for (let i = 0; i < areaPercentages.length; i++ ) {
      areaPixels[i] = Math.round((areaPercentages[i] * totalArea) / 100);
    }

    const pixelPackage = {
      areaPixels: areaPixels,
      available_width: available_width,
      available_height: available_height
    }

    return pixelPackage;
  }

  function determineAreaDimensions(pixelPackage) {
    const areaPixels = pixelPackage.areaPixels;
    const available_width = pixelPackage.available_width;
    const available_height = pixelPackage.available_height;

    let areaDimensions = Array.from({length: bookstoresCount}, () => ({
      // top: 0,
      // left: 0,
      // height: 0,
      // width: 0
    }));


    for (let i = 0; i < areaDimensions.length; i++) {

      let dimensions = {
        top:0,
        left:0,
        height:0,
        width:0,
      }
      //first area
      if (i == 0) {
        dimensions.height = Math.floor(Math.sqrt(areaPixels[i]));
        dimensions.width = Math.floor(Math.sqrt(areaPixels[i]));
        // Adjustment in case the area is odd
        // if (areaPixels[i] % 2 !== 0) {
        //   const remaining = areaPixels[i] - dimensions.height*2;
        //   dimensions.height += remaining;
        // }
        areaDimensions[i] = dimensions;
        continue;
      };

      //continuing "column" if we have remaining height
      const totalHeightSoFar = areaDimensions[i-1].top + areaDimensions[i-1].height;
      if (totalHeightSoFar < available_height) {
        dimensions.left = areaDimensions[i - 1].left
        const remainingHeight = available_height - totalHeightSoFar;
        // Checking if we have enough height remaining to continue
        // with another square or go with rectangle
        if (Math.floor(Math.sqrt(areaPixels[i])) <= remainingHeight) {
          dimensions.height = Math.floor(Math.sqrt(areaPixels[i]));
        } else {
          dimensions.height = remainingHeight;
        }

        //Adding a check to not go overboard with the width;
        const width_length = (dimensions.left + Math.floor(areaPixels[i] / dimensions.height));
        // rectangle
        if (width_length > available_width) {
          dimensions.width = width_length - (available_width - width_length);
        // square
        } else {
          dimensions.width = Math.floor(areaPixels[i] / dimensions.height);
        }

        dimensions.top = totalHeightSoFar;
        areaDimensions[i] = dimensions;
        continue;
      };

      // new "row"
      let newLeft = 0;
      // finding the first previous item in areaDimension that has top 0 to start new row from top
      for (let i2 = areaDimensions.length - 1; i2 >= 0; i2--) {
        if (!areaDimensions[i2]) {
          continue;
        };

        if (areaDimensions[i2].top === 0) {
          newLeft = areaDimensions[i2].left + areaDimensions[i2].width;
          break;
        }
      }
      dimensions.top = 0;
      dimensions.left = newLeft;
      //detecting "collision"
      let maxAvailableHeight = 0;
      for (let i3 = 0; i3 < areaDimensions.length; i3++) {
        if (i3 == 0) {
          continue;
        };
        if (areaDimensions[i3].width + areaDimensions[i3].left > dimensions.left) {
          maxAvailableHeight = areaDimensions[i3].height + areaDimensions[i3].top;
          break;
        }
      }
      if (Math.floor(Math.sqrt(areaPixels[i])) >= maxAvailableHeight) {
        dimensions.height = maxAvailableHeight;
      } else {
        dimensions.height = Math.floor(Math.sqrt(areaPixels[i]));
      }

      const width_length = (dimensions.left + Math.floor(areaPixels[i] / dimensions.height));
      // rectangle
      if (width_length > available_width) {
        dimensions.width = width_length - (available_width - width_length);
      // square
      } else {
        dimensions.width = Math.floor(areaPixels[i] / dimensions.height);
      }
      areaDimensions[i] = dimensions;
    }

    return areaDimensions;
  }

  useEffect(() => {
    const pixelPackage = splitAreas();
    const areaDimensions = determineAreaDimensions(pixelPackage);
    setAreaDimensions(areaDimensions);
  }, [viewportHeight, viewportWidth, currentQuantities])

  async function fetchInventories() {
    try {
      const response = await fetch('http://localhost:3000/admin/inventories', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setData(data[0]);
        setBookstoresCount(parseInt(data[1]));
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchInventories();
  }, []);

  useEffect(() => {
    const newArray = Array.from({length: bookstoresCount}, () => 0);
    for (const inventory of data) {
      newArray[inventory.bookstoreId - 1] += parseInt(inventory.current)
    }
    setCurrentQuantities(newArray);
  }, [data, bookstoresCount]);

  return (
    <div>
      <Navbar subNav={user.role} active={"inventories2"}/>
      <div className="areas-container">
        {areaDimensions && areaDimensions.map((area, index) => (
          <InventoryArea
            key={index}
            top={area.top}
            left={area.left}
            height={area.height}
            width={area.width}/>
        ))}
      </div>
    </div>
  )
}

export default InventoriesAreaDashboard;
