import { useEffect, useState, useContext, useRef } from 'react';
import useCheckUser from "./customHooks/useCheckUser";
import UserContext from "./UserContext";
import './AuthorSales.scss';
import Navbar from "./Navbar";
import BookSelector from './BookSelector';
import SalesContent from './SalesContent';
import LoadingWheel from './LoadingWheel';
import { 
  generateMonthKeysForRangeStr,
  getForMonthStr,
  today,
  localISODateTwelveMonthsAgo
} from '../../backend/utils';
import Alert from "./Alert";
import useViewAsAuthor from "./customHooks/useViewAsAuthor";
import ViewAsAuthorBanner from "./ViewAsAuthorBanner";

function AuthorSales() {
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const { isViewingAsAuthor, authorName, appendAuthorParam } = useViewAsAuthor();
  const [salesData, setSalesData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState('total');
  const [dateRange, setDateRange] = useState({
    startDateStr: localISODateTwelveMonthsAgo(),
    endDateStr: today()
  });
const [alertMessage, setAlertMessage] = useState("");
const [alertType, setAlertType] = useState("");

const startDateRef = useRef(null);
const endDateRef = useRef(null);

useEffect(() => {
  if (startDateRef.current && dateRange.startDateStr) {
    const parts = dateRange.startDateStr.split('-');
    startDateRef.current.valueAsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  if (endDateRef.current && dateRange.endDateStr) {
    const parts = dateRange.endDateStr.split('-');
    endDateRef.current.valueAsDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
}, [])

function processMonthlyData(sales, bookId = 'total') {
    const monthlySales = {};
    // if (!sales || sales.length === 0) return;
    if (sales && sales.length > 0 ) {
      const filteredSales = bookId === 'total'
        ? sales
        : sales.filter(sale => sale.book_id === parseInt(bookId));

      filteredSales.forEach(sale => {
        const date = sale.dateStr;
        // const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthKey = getForMonthStr(date);

      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = {
          month: monthKey,
          quantity: 0,
          value: 0
        };
      }
      if (sale.quantity) {
        monthlySales[monthKey].quantity += sale.quantity;
      }
      monthlySales[monthKey].value += sale.value;
    });

      const sortedData = Object.values(monthlySales).sort((a, b) => a.month.localeCompare(b.month));
      for (const month of sortedData) {
        month.value = Number((month.value).toFixed(2));
      }

      const monthKeysInRange = generateMonthKeysForRangeStr(dateRange.startDateStr, dateRange.endDateStr);
      // let counter = 0;
      // for (let i = 0; i < monthKeysInRange.length; i++) {
      //   if (sortedData[counter] === undefined || monthKeysInRange[i] !== sortedData[counter].month) {
      //     const monthToInsert = {
      //       "month": monthKeysInRange[i],
      //       "quantity": 0,
      //       "value": 0
      //     }
      //     sortedData.splice(i, 0, monthToInsert)
      //   } else {
      //     counter += 1
      //   }
      // }
      const finalData = monthKeysInRange.map(monthKey => {
        return monthlySales[monthKey] ?? {
          month: monthKey,
          quantity: 0,
          value: 0
        };
      });
      setMonthlyData(finalData);
    } else {
      const monthKeysInRange = generateMonthKeysForRangeStr(dateRange.startDateStr, dateRange.endDateStr);
      let sortedData = []
      for (const month of monthKeysInRange) {
        const monthToPush = {
          "month": month,
          "quantity": 0,
          "value": 0
        }
        sortedData.push(monthToPush)
      };
      setMonthlyData(sortedData)
    }
  }

  const fetchSales = async (forceFetch) => {
    try {
      // const cachedAuthorSalesData = sessionStorage.getItem("authorSalesData");
      // if (cachedAuthorSalesData && !forceFetch) {
      //   setSalesData(JSON.parse(cachedAuthorSalesData));
      //   processMonthlyData(JSON.parse(cachedAuthorSalesData).sales, selectedBook);
      //   return
      // }

      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        startDateStr: dateRange.startDateStr,
        endDateStr: dateRange.endDateStr
      });

      const response = await fetch(appendAuthorParam(`${baseURL}/api/author/sales/sales?${queryParams}`), {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // sessionStorage.setItem("authorSalesData", JSON.stringify(data));
      setSalesData(data);
      processMonthlyData(data.sales, selectedBook);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to fetch sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== null) {
      fetchSales();
    }
  }, []);

  const handleBookChange = (event) => {
    const bookId = event.target.value;
    setSelectedBook(bookId);
    processMonthlyData(salesData.sales, bookId);
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;

    let valueChecked = value;
    //checking date is not in the future or start date is not after end date
    if (name === "endDateStr")  {
      if ((value) > today()) {
        // valueChecked = new Date().toLocaleDateString('en-CA')
        setAlertMessage("No se puede poner una fecha de fin en el futuro.")
        setAlertType("error")
      }
    } else if (name === "startDateStr") {
      if (value > today() || value > dateRange.endDateStr) {
        // valueChecked = new Date().toLocaleDateString('en-CA')
        setAlertMessage("No se puede poner una fecha de inicio en el futuro o después de la fecha de fin")
        setAlertType("error")
      }
    }
    setDateRange(prev => ({
      ...prev,
      [name]: valueChecked
    }));
  };

  const handleApplyDateRange = () => {
    const forceFetch = true;
    fetchSales(forceFetch);
  };

  if (loading) {
    return <div className="sales-container"><LoadingWheel /></div>;
  }

  if (error) {
    return <div className="sales-container">Error: {error}</div>;
  }

  if (!salesData) {
    return <div className="sales-container">No hay información de ventas.</div>;
  }

  

  return (
    <div className="author-sales"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"ventas"} />
      {isViewingAsAuthor && <ViewAsAuthorBanner authorName={authorName} />}
      <div id="author-sales-container">
        <div className="date-range-selector">
          <div className="date-input">
          <BookSelector
            booksInventories={salesData.bookSales}
            onBookChange={handleBookChange}
            selectedValue={selectedBook}
            fontSize={user.font_size}
          />
          </div>
          <div className="date-input">
            <input
              type="date"
              id="startDate"
              name="startDateStr"
              ref={startDateRef}
              onChange={handleDateChange}
            />
          </div>
          <div className="date-input">
            <input
              type="date"
              id="endDate"
              name="endDateStr"
              ref={endDateRef}
              onChange={handleDateChange}
            />
          </div>
          <button
            className="apply-date-range-btn"
            onClick={handleApplyDateRange}
          >
            Aplicar fechas
          </button>
        </div>
        <SalesContent
          salesData={salesData}
          selectedBook={selectedBook}
          monthlyData={monthlyData}
          preferredFontSize={user.font_size}
        />
      </div>
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  );
}

export default AuthorSales;
