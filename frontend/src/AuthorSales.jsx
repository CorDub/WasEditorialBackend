import { useEffect, useState, useContext } from 'react';
import useCheckUser from "./customHooks/useCheckUser";
import UserContext from "./UserContext";
import './AuthorSales.scss';
import Navbar from "./Navbar";
import BookSelector from './BookSelector';
import SalesContent from './SalesContent';

function AuthorSales() {
  useCheckUser();
  const { user } = useContext(UserContext);
  const [salesData, setSalesData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState('total');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  function processMonthlyData(sales, bookId = 'total') {
    const monthlySales = {};
    if (!sales || sales.length === 0) return;

    const filteredSales = bookId === 'total'
      ? sales
      : sales.filter(sale => sale.book_id === parseInt(bookId));


    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = {
          month: monthKey,
          quantity: 0,
          value: 0
        };
      }
      monthlySales[monthKey].quantity += sale.quantity;
      monthlySales[monthKey].value += sale.value;
    });

    const sortedData = Object.values(monthlySales).sort((a, b) => a.month.localeCompare(b.month));
    setMonthlyData(sortedData);
  }

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`http://localhost:3000/author/sales?${queryParams}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
    fetchSales();
  }, []);

  const handleBookChange = (event) => {
    const bookId = event.target.value;
    setSelectedBook(bookId);
    processMonthlyData(salesData.sales, bookId);
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyDateRange = () => {
    fetchSales();
  };

  if (loading) {
    return <div className="sales-container">Loading sales data...</div>;
  }

  if (error) {
    return <div className="sales-container">Error: {error}</div>;
  }

  if (!salesData) {
    return <div className="sales-container">No hay información de ventas.</div>;
  }

  return (
    <>
      <Navbar subNav={user.role} active={"ventas"} />
      <div id="author-sales-container">
        <div className="date-range-selector">
          <div className="date-input">
          {/* <label>Inventario:</label> */}
          <BookSelector
            booksInventories={salesData.bookSales}
            onBookChange={handleBookChange}
            selectedValue={selectedBook}
          />
          </div>
          <div className="date-input">
            {/* <label htmlFor="startDate">Start Date:</label> */}
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="date-input">
            {/* <label htmlFor="endDate">End Date:</label> */}
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
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
        />
      </div>
    </>
  );
}

export default AuthorSales;
