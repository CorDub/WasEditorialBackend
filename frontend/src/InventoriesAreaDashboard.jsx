import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import UserContext from "./UserContext";
import "./InventoriesAreaDashboard.scss"
import InventoryArea from "./InventoryArea";
import BookInventory from "./BookInventory";
import BookstoreInventory from "./BookstoreInventory";

function InventoriesAreaDashboard() {
  useCheckAdmin();
  const [data, setData] = useState([]);
  const { user } = useContext(UserContext);
  const [currentQuantities, setCurrentQuantities] = useState([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const available_height = viewportHeight - 70;
  const available_width = viewportWidth - 20;
  const [areaDimensions, setAreaDimensions] = useState([]);
  const [bookstoresCounts, setBookstoresCounts] = useState([]);
  const [isBookInventoryOpen, setBookInventoryOpen] = useState(false);
  const [isBookstoreInventoryOpen, setBookstoreInventoryOpen] = useState(false);
  const [selectedBookstore, setSelectedBookstore] = useState("");
  const [retreat, setRetreat] = useState(false);

  useEffect(() => {
    function handleResize() {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function getBookstoresNamesandCounts(data) {
    const resCounts = [];

    for (let i = 0; i < data.length; i++) {
      if (!resCounts[data[i].bookstoreId]) {
        let bookstoreObject = {
          name: data[i].bookstore.name,
          count: data[i].current
        }
        resCounts[data[i].bookstoreId] = bookstoreObject;
      } else {
        resCounts[data[i].bookstoreId].count += data[i].current
      }
    }

    const filteredResCounts = resCounts.filter(count => count !== "");
    const sortedResCounts = filteredResCounts.sort((a, b) => b.count - a.count);

    setBookstoresCounts(sortedResCounts);
  }

  useEffect(() => {
    getBookstoresNamesandCounts(data);
  }, [data])

  function splitAreas() {
    const totalArea = available_height * available_width

    //get percentages split
    let totalCurrentQuantities = 0
    for (const quantity of currentQuantities) {
      totalCurrentQuantities += quantity
    }

    const areaPercentages = Array.from({length: bookstoresCounts.length}).fill(0);
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

    const areaPixels = Array.from({length: bookstoresCounts.length}).fill(0);

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

    const antePreviousAreaRight = antePreviousArea.left + antePreviousArea.width;
    const previousAreaRight = previousArea.left + previousArea.width;
    const leastRightmost = antePreviousAreaRight > previousAreaRight ? previousArea : antePreviousArea;

    let nextStartingPoint = {
      top: 0,
      left: 0,
      maxHeight: 0
    };

    nextStartingPoint.top = leastRightmost.top;
    nextStartingPoint.left = leastRightmost.left + leastRightmost.width;
    nextStartingPoint.maxHeight = leastRightmost.top + leastRightmost.height;

    return nextStartingPoint;
  }

  function determineAreaDimensions(pixelPackage) {
    const areaPixels = pixelPackage.areaPixels;

    let areaDimensions = Array.from({length: bookstoresCounts.length}, () => ({
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
        let secondRightmost = {id: 0, right: 0};
        for (let i2 = 0; i2 < i; i2++) {
          const currentRight = areaDimensions[i2].left + areaDimensions[i2].width
          const previousAreaRight = previousArea.left + previousArea.width
          if (currentRight > secondRightmost.right && currentRight !== previousAreaRight) {
              secondRightmost.right = areaDimensions[i2].left + areaDimensions[i2].width;
              secondRightmost.id = i2;
            }
        }
        antePreviousArea = areaDimensions[secondRightmost.id];
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
      return;
    }

    let top_width = 0;
    let bot_width = 0;

    for (const area of areaDimensions) {
      if (area.top === 0) {
        top_width += area.width;
      } else {
        bot_width += area.width;
      }
    }

    const smaller_side = top_width < bot_width ? top_width : bot_width;
    const missing_width = smaller_side === top_width ? smaller_side - bot_width : smaller_side - top_width;

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

    let totalPercentages = 0;
    for (const percent of percentages) {
      totalPercentages += percent.percentage;
    }
    if (totalPercentages > 100) {
      percentages[percentages.length-1].percentage -= (totalPercentages - 100);
    } else {
      percentages[percentages.length-1].percentage += (100 - totalPercentages);
    }

    let missing_width_percentages = [];
    for (const percentage of percentages) {
      let areaMissingPercentage = {
        index: percentage.index,
        missingLength: Math.abs(Math.round(percentage.percentage * missing_width / 100))
      }
      missing_width_percentages.push(areaMissingPercentage);
    }

    let finalAreaDimensions = [...areaDimensions];
    for (let i = 0; i < missing_width_percentages.length; i++) {
      if (i === 0) {
        finalAreaDimensions[missing_width_percentages[i].index].width += missing_width_percentages[i].missingLength;
      } else {
        finalAreaDimensions[missing_width_percentages[i].index].width += missing_width_percentages[i].missingLength;
        finalAreaDimensions[missing_width_percentages[i].index].left = finalAreaDimensions[missing_width_percentages[i-1].index].width + finalAreaDimensions[missing_width_percentages[i-1].index].left;
      }
    }
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
        setData(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchInventories();
  }, []);

  useEffect(() => {
    const newArray = Array.from({length: bookstoresCounts.length}, () => 0);
    for (const inventory of data) {
      newArray[inventory.bookstoreId - 1] += parseInt(inventory.current)
    }
    setCurrentQuantities(newArray);
  }, [data, bookstoresCounts]);

  useEffect(() => {
    const pixelPackage = splitAreas();
    const areaDimensions = determineAreaDimensions(pixelPackage);
    setAreaDimensions(areaDimensions);

    const finalAreaDimensions = finalAdjustment(areaDimensions);
    setAreaDimensions(finalAreaDimensions);
  }, [viewportHeight, viewportWidth, currentQuantities])

  // function minifyAreas() {
  //   for (const area in areaDimensions) {
  //     if ()
  //   }
  // }

  return (
    <div className="inventory-area-container">
      <Navbar subNav={user.role} active={"inventories2"}/>
      {isBookInventoryOpen === false && isBookstoreInventoryOpen === false &&
      <div className="areas-container">
        {areaDimensions && bookstoresCounts && areaDimensions.map((area, index) => {
          const bookstore = bookstoresCounts[index];
          const noSpaceName = bookstore.name.replace(' ', '');
          return (
            <InventoryArea
              key={index}
              name={noSpaceName}
              count={bookstore.count}
              top={area.top}
              left={area.left}
              height={area.height}
              width={area.width}
              setBookstoreInventoryOpen={setBookstoreInventoryOpen}
              setSelectedBookstore={setSelectedBookstore}
              retreat={retreat}
              setRetreat={setRetreat}/>
            )
          })}
      </div>}

      {isBookstoreInventoryOpen &&
        <BookstoreInventory selectedBookstore={selectedBookstore}/>}
    </div>
  )
}

export default InventoriesAreaDashboard;
