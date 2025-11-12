import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useContext, useState, useEffect } from "react";
import UserContext from "./UserContext";
import TableWithDrawers from "./TableWithDrawers";
import LoadingWheel from "./LoadingWheel";
import { twelveMonthsAgo, applyFilters } from "../../backend/utils";

function KindleSalesListPerMonth() {
  useCheckAdmin();
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [isLoading, setLoading] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  const [activeMonth, setActiveMonth] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [monthsInRange, setMonthsInRange] = useState([]);
  const [booksInMonth, setBooksInMonth] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [authorsInMonth, setAuthorsInMonth] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [startDate, setStartDate] = useState(new Date(twelveMonthsAgo().setDate(1)));
  const [endDate, setEndDate] = useState(new Date());

  async function fetchKindleSalesPerMonth(startDate, endDate) {
    try {
      setLoading(true)
      const response = await fetch(`${baseURL}/admin/kindlesales?startDate=${startDate}&endDate=${endDate}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      }) 

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("startDate", startDate)
        sessionStorage.setItem("endDate", endDate)
        setData(data);
        setLoading(false);
        setActiveMonth(data[data.length-1].forMonth);
        setFilteredData(data[data.length-1].sales);
        let monthsInRange = [];
        for (let i = 0; i < data.length; i++) {
          monthsInRange.push(data[data.length-1-i].forMonth)
        }
        setMonthsInRange(monthsInRange)
        setBooksInMonth(data[data.length-1].books)
        setAuthorsInMonth(data[data.length-1].authors)
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchKindleSalesPerMonth(startDate, endDate);
  }, [forceRender])

  async function refetchAndFilter() {
    //checking if a refecth is needed if the time range changed
    const previousStartDate = sessionStorage.getItem("startDate");
    const previousEndDate = sessionStorage.getItem("endDate");

    if (startDate < new Date(previousStartDate)
      && endDate > new Date(previousEndDate)
    ) {
      await fetchKindleSalesPerMonth(startDate, endDate)
    }

    let monthData = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].forMonth === activeMonth) {
        monthData = data[i].sales;
        setBooksInMonth(data[i].books);
        setAuthorsInMonth(data[i].authors);
      }
    }

    const filters = {
      "selectedBook": selectedBook,
      "selectedAuthor": selectedAuthor
    }

    const filteredData = applyFilters(monthData, filters, 'kindle');
    setFilteredData(filteredData)
  }

  useEffect(() => {
    refetchAndFilter()
  }, [activeMonth, forceRender])

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"kindle"} />
      {isLoading && <LoadingWheel />}
      {data && !isLoading && 
        <TableWithDrawers 
          data={filteredData}
          monthsInRange={monthsInRange}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          booksInMonth={booksInMonth}
          selectedBook={selectedBook}
          setSelectedBook={setSelectedBook}
          authorsInMonth={authorsInMonth}
          selectedAuthor={selectedAuthor}
          setSelectedAuthor={setSelectedAuthor}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          refetchAndFilter={refetchAndFilter}
          salesType={"kindle"}
          forceRender={forceRender}
          setForceRender={setForceRender} />}
    </div>
  )
}

export default KindleSalesListPerMonth;