import { useState, useEffect, useContext, useRef } from "react";
import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import UserContext from "./UserContext";
import "./InventoriesAreaDashboard.scss"

function InventoriesAreaDashboard() {
  useCheckAdmin();
  const [data, setData] = useState([]);
  const [bookstoresCount, setBookstoresCount] = useState(null);
  const { user } = useContext(UserContext);
  const [currentQuantities, setCurrentQuantities] = useState([]);
  const containerRef = useRef();

  function splitAreas() {
    //get max available width and height
    const computedStyle = window.getComputedStyle(containerRef.current);
    const available_height_str = computedStyle.height;
    const available_height = parseInt(available_height_str.replace("px", ""));
    const available_width = parseInt(computedStyle.width.replace("px", ""));

    console.log(available_height);
    console.log(available_width);
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
        dimensions.height = Math.floor(areaPixels[i]/2);
        dimensions.width = Math.floor(areaPixels[i]/2);
        if (areaPixels[i] % 2 !== 0) {
          const remaining = areaPixels[i] - dimensions.height*2;
          dimensions.height += remaining;
        }
        areaDimensions[i] = dimensions;

        continue;
      };

      //continuing "column"
      const totalHeightSoFar = areaDimensions[i-1].top + areaDimensions[i-1].height;
      if (totalHeightSoFar < available_height) {
        const remainingHeight = available_height - totalHeightSoFar;
        if (Math.floor(areaPixels[i]/2) <= remainingHeight) {
          dimensions.height = Math.floor(areaPixels[i]/2);
        } else {
          dimensions.height = remainingHeight;
        }
        dimensions.width = Math.floor(areaPixels[i] / dimensions.height)
        dimensions.top = totalHeightSoFar;
        dimensions.left = areaDimensions[i - 1].left
        areaDimensions[i] = dimensions;

        continue;
      }

      // new "row"
      let newLeft = 0;
      for (let i2 = areaDimensions.length - 1; i2 >= 0; i2--) {
        if (!areaDimensions[i2]) {
          continue;
        };

        if (areaDimensions[i2].top === 0) {
          newLeft = areaDimensions[i2].width;
          return;
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
        if (areaDimensions[i3].width > areaDimensions[i3-1].width) {
          maxAvailableHeight = areaDimensions[i3-1].height;
          return;
        }
      }
      if (Math.floor(areaPixels[i]/2) >= maxAvailableHeight) {
        dimensions.height = maxAvailableHeight;
      } else {
        dimensions.height = Math.floor(areaPixels[i]/2)
      }
      dimensions.width = Math.floor(areaPixels[i] / dimensions.height);
      areaDimensions[i] = dimensions;
    }

    return areaDimensions;
  }

  useEffect(() => {
    const pixelPackage = splitAreas();
    const areaDimensions = determineAreaDimensions(pixelPackage);
    console.log(areaDimensions);
  }, [containerRef, currentQuantities])

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
      <div className="areas-container" ref={containerRef}>

      </div>
    </div>
  )
}

export default InventoriesAreaDashboard;
