import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useContext, useState } from "react";
import UserContext from "./UserContext";
import TableWithDrawers from "./TableWithDrawers";
import LoadingWheel from "./LoadingWheel";
import { useEffect } from "react";

function SalesListPerMonths() {
  useCheckAdmin();
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [isLoading, setLoading] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  const [activeMonth, setActiveMonth] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [monthsInRange, setMonthsInRange] = useState([]);

  useEffect(() => {
    async function fetchSalesPerMonths() {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/admin/sales`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setData(data);
        setLoading(false);
        setActiveMonth(data[data.length-1].forMonth);
        setFilteredData(data[data.length-1].sales);
        let monthsInRange = [];
        for (let i = 0; i < data.length; i++) {
          monthsInRange.push(data[data.length-1-i].forMonth)
        }
        setMonthsInRange(monthsInRange)
      }
    } catch(error) {
      console.log(error);
    }
  }
  
  fetchSalesPerMonths();
  }, [forceRender])

  useEffect(() => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].forMonth === activeMonth) {
        setFilteredData(data[i].sales)
      }
    }
  }, [activeMonth])

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"sales2"} />
      {isLoading && <LoadingWheel />}
      {data && !isLoading && 
        <TableWithDrawers 
          data={filteredData}
          monthsInRange={monthsInRange}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}/>}
    </div>
  )
}

export default SalesListPerMonths;

