import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useContext, useState } from "react";
import UserContext from "./UserContext";
import TableWithDrawers from "./TableWithDrawers";
import LoadingWheel from "./LoadingWheel";
import { useEffect } from "react";
import { twelveMonthsAgo } from "../../backend/utils";

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
  const [startDate, setStartDate] = useState(new Date(twelveMonthsAgo().setDate(1)));
  const [endDate, setEndDate] = useState(new Date());

  async function fetchSalesPerMonths(startDate, endDate) {
    try {
      setLoading(true);
      // const cachedSalesPerMonth = JSON.parse(sessionStorage.getItem("salesPerMonth"));
      

      // if (cachedSalesPerMonth && !forceRender) {
      //   setData(cachedSalesPerMonth);
      //   setLoading(false);
      //   setActiveMonth(cachedSalesPerMonth[cachedSalesPerMonth.length-1].forMonth);
      //   setFilteredData(cachedSalesPerMonth[cachedSalesPerMonth.length-1].sales);
      //   let monthsInRange = [];
      //   //reversing the order so that the last month is on top
      //   for (let i = 0; i < cachedSalesPerMonth.length; i++) {
      //     monthsInRange.push(cachedSalesPerMonth[cachedSalesPerMonth.length-1-i].forMonth)
      //   }
      //   setMonthsInRange(monthsInRange)
      //   setBookstoresInMonth(cachedSalesPerMonth[cachedSalesPerMonth.length-1].bookstores)
      //   setBooksInMonth(cachedSalesPerMonth[cachedSalesPerMonth.length-1].books)
      //   setAuthorsInMonth(cachedSalesPerMonth[cachedSalesPerMonth.length-1].authors)
      // }

      const response = await fetch(`${baseURL}/admin/sales?startDate=${JSON.stringify(startDate)}&endDate=${JSON.stringify(endDate)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        // sessionStorage.setItem("salesPerMonth", JSON.stringify(data))
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
      console.log(error);
    }
  }
  
  useEffect(() => {
    fetchSalesPerMonths(startDate, endDate);
  }, [forceRender])

  useEffect(() => {
    applyFilters()
  }, [activeMonth])

  async function applyFilters() {
    const previousStartDate = sessionStorage.getItem("startDate");
    const previousEndDate = sessionStorage.getItem("endDate");

    //not fetching if range is the same or smaller
    if (startDate < new Date(previousStartDate)
      && endDate > new Date(previousEndDate)
    ) {
      await fetchSalesPerMonths(startDate, endDate)
    }

    let monthData = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].forMonth === activeMonth) {
        monthData = data[i].sales;
      }
    }

    let filteredResults = [];
    // for (const sale of monthData) {
    //   if (sale.inventory.bookstore.name === selectedBookstore && selectedBookstore !== "") {
    //     filteredResults.push(sale)
    //     continue
    //   } else if (sale.inventory.book.title === selectedBook && selectedBook !== "") {
    //     filteredResults.push(sale)
    //     continue
    //   } else if (sale.authorsString.includes(selectedAuthor) && selectedAuthor !== "") {
    //     filteredResults.push(sale)
    //   } else if (selectedBookstore === "" && selectedBook === "" && selectedAuthor === "") {
    //     filteredResults.push(sale)
    //   }   
    // }
    let activeFilters = []
    function filterBookstore(sale) {
      return sale.inventory.bookstore.name === selectedBookstore
    }
    function filterBook(sale) {
      return sale.inventory.book.title === selectedBook
    }
    function filterAuthor(sale) {
      return sale.authorsString.includes(selectedAuthor)
    }

    if (selectedBookstore !== "") {
      activeFilters.push(filterBookstore)
    }
    if (selectedBook !== "") {
      activeFilters.push(filterBook)
    }
    if (selectedAuthor !== "") {
      activeFilters.push(filterAuthor)
    }

    for (const sale of monthData) {
      if (activeFilters.length === 0) {
        filteredResults = monthData
        break;
      }

      let retained = true
      for (const filter of activeFilters) {
        if (filter(sale) === false) {
          retained = false;
          break;
        }
      }
      if (retained) {
        filteredResults.push(sale)
      }
    }

    setFilteredData(filteredResults)
  }

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"sales2"} />
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
          applyFilters={applyFilters}/>}
    </div>
  )
}

export default SalesListPerMonths;

