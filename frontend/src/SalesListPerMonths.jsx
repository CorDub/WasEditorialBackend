import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useContext, useState } from "react";
import UserContext from "./UserContext";
import TableWithDrawers from "./TableWithDrawers";
import LoadingWheel from "./LoadingWheel";
import { useEffect } from "react";
import { 
  applyFilters, 
  localISODateTwelveMonthsAgo,
  today 
} from "../../backend/utils";

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
  const [bookstoresInMonth, setBookstoresInMonth] = useState([]);
  const [selectedBookstore, setSelectedBookstore] = useState("");
  const [booksInMonth, setBooksInMonth] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [authorsInMonth, setAuthorsInMonth] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [startDate, setStartDate] = useState(localISODateTwelveMonthsAgo());
  const [endDate, setEndDate] = useState(today());

  useEffect(() => {
    fetchSalesPerMonths(startDate, today());
  }, [forceRender])


  async function fetchSalesPerMonths(startDate, endDate) {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/api/admin/sales/sales?startDate=${startDate}&endDate=${endDate}`, {
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
        setBookstoresInMonth(data[data.length-1].bookstores)
        setBooksInMonth(data[data.length-1].books)
        setAuthorsInMonth(data[data.length-1].authors)
      }
    } catch(error) {
      console.error(error);
    }
  }

  async function refetchAndFilter() {
    try {
      // Check whether the date range has changed
      let dateRangeChanged = false;

      const storedEndDate = new Date(sessionStorage.getItem("endDate"));
      const dateOnlySED = storedEndDate.toISOString().split('T')[0];
      const currentEndDate = new Date(endDate);
      const dateOnlyCED = currentEndDate.toISOString().split('T')[0];
      if (dateOnlyCED !== dateOnlySED) {
        // fetchSalesPerMonths(startDate, endDate)
        dateRangeChanged = true
        sessionStorage.setItem("endDate", endDate)
        sessionStorage.setItem("startDate", startDate)
      }

      const storedStartDate = new Date(sessionStorage.getItem("startDate"));
      const dateOnlySSD = storedStartDate.toISOString().split('T')[0];
      const currentStartDate = new Date(startDate);
      const dateOnlyCSD = currentStartDate.toISOString().split('T')[0];
      if (dateOnlyCSD !== dateOnlySSD) {
        // fetchSalesPerMonths(startDate, endDate)
        dateRangeChanged = true
        sessionStorage.setItem("endDate", endDate)
        sessionStorage.setItem("startDate", startDate)
      }

      let currentData = data
      //refetch if date has changed
      if (dateRangeChanged) {
        setLoading(true);
        const response = await fetch(`${baseURL}/api/admin/sales/sales?startDate=${startDate}&endDate=${endDate}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json();
          // sessionStorage.setItem("startDate", startDate)
          // sessionStorage.setItem("endDate", endDate)
          setData(data);
          currentData = data;
          setLoading(false);
          setActiveMonth(data[data.length-1].forMonth);
          setFilteredData(data[data.length-1].sales);
          let monthsInRange = [];
          for (let i = 0; i < data.length; i++) {
            monthsInRange.push(data[data.length-1-i].forMonth)
          }
          setMonthsInRange(monthsInRange)
          setBookstoresInMonth(data[data.length-1].bookstores)
          setBooksInMonth(data[data.length-1].books)
          setAuthorsInMonth(data[data.length-1].authors)
        }
      }

      let monthData;
      for (let i = 0; i < currentData.length; i++) {
        if (currentData[i].forMonth === activeMonth) {
          monthData = data[i].sales;
          setBookstoresInMonth(data[i].bookstores);
          setBooksInMonth(data[i].books);
          setAuthorsInMonth(data[i].authors);
        }
      }

      const filters = {
        "selectedBook": selectedBook,
        "selectedBookstore": selectedBookstore,
        "selectedAuthor": selectedAuthor
      }

      const filteredData = applyFilters(monthData, filters, "sales");
      setFilteredData(filteredData)

    } catch(error) {
      console.error(error);
    }
  }

  useEffect(() => {
    refetchAndFilter()
  }, [activeMonth])

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"ventas"} />
      {isLoading && <LoadingWheel />}
      {data && !isLoading &&
        <TableWithDrawers
          data={filteredData}
          monthsInRange={monthsInRange}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          bookstoresInMonth={bookstoresInMonth}
          selectedBookstore={selectedBookstore}
          setSelectedBookstore={setSelectedBookstore}
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
          salesType={"normal"}
          setForceRender={setForceRender}/>}
    </div>
  )
}

export default SalesListPerMonths;
