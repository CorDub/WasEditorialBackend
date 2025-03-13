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
  const available_height = viewportHeight - 70;
  const available_width = viewportWidth - 20;
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

    areaPixels.sort((a,b) => b - a);

    const pixelPackage = {
      areaPixels: areaPixels,
    }

    return pixelPackage;
  }

  function determineNextStartingPoint(previousArea, antePreviousArea) {
    if (!antePreviousArea) {
      const nextStartingPoint = {
        top: previousArea.height,
        left: 0,
        maxHeight: available_height
      }
      return nextStartingPoint;
    }

    let nextStartingPoint = {
      top: 0,
      left: 0,
      maxHeight: 0
    };

    if (previousArea.left + previousArea.width >= antePreviousArea.left + antePreviousArea.width) {
      nextStartingPoint.left = antePreviousArea.left + antePreviousArea.width
      nextStartingPoint.top = antePreviousArea.top;
      if (nextStartingPoint.top >= previousArea.top) {
        nextStartingPoint.maxHeight = available_height;
      } else {
        nextStartingPoint.maxHeight = previousArea.top;
      }

    } else {
      nextStartingPoint.left = previousArea.left + previousArea.width;
      nextStartingPoint.top = previousArea.top;
      nextStartingPoint.maxHeight = available_height;
    }

    return nextStartingPoint;
  }

  function determineAreaDimensions(pixelPackage) {
    const areaPixels = pixelPackage.areaPixels;

    let areaDimensions = Array.from({length: bookstoresCount}, () => ({
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
        dimensions.height = Math.round(Math.sqrt(areaPixels[i] / 2));
        dimensions.width = Math.round(dimensions.height * 2);
        areaDimensions[i] = dimensions;
        continue;
      };

      let previousArea = areaDimensions[i-1];
      let antePreviousAreaIndex = 2;
      let antePreviousArea = areaDimensions[i-antePreviousAreaIndex];

      if (antePreviousArea) {
        while (antePreviousArea.top === previousArea.top) {
          antePreviousAreaIndex += 1;
          antePreviousArea = areaDimensions[i-antePreviousAreaIndex];
        };
      };

      /// general loop
      const nsp = determineNextStartingPoint(previousArea, antePreviousArea);
      dimensions.top = nsp.top;
      dimensions.left = nsp.left;
      dimensions.height = nsp.maxHeight - dimensions.top;

      const width_length = (dimensions.left + Math.round(areaPixels[i] / dimensions.height))

      if (width_length > available_width) {
        dimensions.width = available_width - dimensions.left;
      } else {
        dimensions.width =  Math.floor(areaPixels[i] / dimensions.height);
      };
      areaDimensions[i] = dimensions;
    }

    return areaDimensions;
  }

  function finalAdjustment(areaDimensions) {
    if (areaDimensions.length === 0) {
      console.log("areadimensions undefined");
      return;
    }

    console.log('areaDimensions', areaDimensions);

    let top_width = 0;
    let bot_width = 0;

    for (const area of areaDimensions) {
      if (area.top === 0) {
        top_width += area.width;
      } else {
        bot_width += area.width;
      }
    }

    console.log("top_width", top_width);
    console.log("bot_width", bot_width);

    const smaller_side = top_width < bot_width ? top_width : bot_width;
    const missing_width = smaller_side === top_width ? smaller_side - bot_width : smaller_side - top_width;

    console.log("smaller_side", smaller_side);
    console.log("missing_width", missing_width);

    let percentages = [];
    if (smaller_side === top_width) {
      for (let i = 0; i < areaDimensions.length; i++) {
        let areaPercentage = {
          index: 0,
          percentage: 0
        }
        if (areaDimensions[i].top === 0) {
          areaPercentage.index = i;
          areaPercentage.percentage = Math.round(areaDimensions[i].width / smaller_side * 100);
          percentages.push(areaPercentage);
        }
      }
    } else {
      for (let i = 0; i < areaDimensions.length; i++) {
        let areaPercentage = {
          index: 0,
          percentage: 0
        }
        if (areaDimensions[i].top !== 0) {
          areaPercentage.index = i;
          areaPercentage.percentage = Math.round(areaDimensions[i].width / smaller_side * 100);
          percentages.push(areaPercentage);
        }
      }
    }

    console.log("percentages", percentages);

    let totalPercentages = 0;
    for (const percent of percentages) {
      totalPercentages += percent.percentage;
    }
    if (totalPercentages > 100) {
      percentages[percentages.length-1].percentage -= (totalPercentages - 100);
    } else {
      percentages[percentages.length-1].percentage += (100 - totalPercentages);
    }

    console.log("percentages after adjustment", percentages);

    let missing_width_percentages = [];
    for (const percentage of percentages) {
      let areaMissingPercentage = {
        index: percentage.index,
        missingLength: Math.abs(Math.round(percentage.percentage * missing_width / 100))
      }
      missing_width_percentages.push(areaMissingPercentage);
    }

    console.log("missing_width_percentages", missing_width_percentages);

    let finalAreaDimensions = [...areaDimensions];
    for (let i = 0; i < missing_width_percentages.length; i++) {
      if (i === 0) {
        finalAreaDimensions[missing_width_percentages[i].index].width += missing_width_percentages[i].missingLength;
      } else {
        console.log(finalAreaDimensions[missing_width_percentages[i].index])
        finalAreaDimensions[missing_width_percentages[i].index].width += missing_width_percentages[i].missingLength;
        finalAreaDimensions[missing_width_percentages[i].index].left = finalAreaDimensions[missing_width_percentages[i-1].index].width + finalAreaDimensions[missing_width_percentages[i-1].index].left;
      }
    }

    console.log("final_area_dimensions", finalAreaDimensions);
    return finalAreaDimensions;
  };

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

  useEffect(() => {
    const pixelPackage = splitAreas();
    const areaDimensions = determineAreaDimensions(pixelPackage);
    setAreaDimensions(areaDimensions);

    const finalAreaDimensions = finalAdjustment(areaDimensions);
    setAreaDimensions(finalAreaDimensions);
  }, [viewportHeight, viewportWidth, currentQuantities])

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
