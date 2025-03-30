import React, { useEffect, useState, useContext } from 'react';
import UserContext from "./UserContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AuthorSales.scss';
import Navbar from "./Navbar";
import BookSelector from './CustomDropdown';

function AuthorSales() {
  const { user } = useContext(UserContext);
  const [salesData, setSalesData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState('total');

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
        monthlySales[monthKey] = 0;
      }
      monthlySales[monthKey] += sale.quantity;
    });

    const chartData = Object.entries(monthlySales)
      .map(([month, quantity]) => ({
        month,
        quantity
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyData(chartData);
  }

  useEffect(() => {
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (salesData) {
      processMonthlyData(salesData.sales, selectedBook);
    }
  }, [selectedBook, salesData]);

  async function fetchSalesData() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/author/sales', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
        processMonthlyData(data.sales, selectedBook);
      } else {
        setError('Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Error fetching sales data');
    } finally {
      setLoading(false);
    }
  }

  const handleBookChange = (event) => {
    setSelectedBook(event.target.value);
  };

  if (loading) {
    return <div className="sales-container">Cargando informacion de ventas...</div>;
  }

  if (error) {
    return <div className="sales-container">Error: {error}</div>;
  }

  if (!salesData) {
    return <div className="sales-container">No hay informacion de ventas.</div>;
  }

  const selectedBookSales = selectedBook === 'total'
    ? salesData.totalSales
    : salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.quantity || 0;

  return (
    <>
      <Navbar subNav={user.role} active={"autores"} />
      <div id="author-sales-container">
        <h2>Resumen de ventas</h2>
        <div id="author-sales-content">
          <div id="author-sales-content-left">
            <div id="total-sales">
              <h3>Total de libros vendidos</h3>
              <p>{selectedBookSales}</p>
            </div>
            {selectedBook === 'total' && (
              <div id="books-sold">
                <h3>Libros vendidos</h3>
                <ul>
                  {salesData.bookSales.map(book => (
                    <li key={book.bookId}>
                      {book.title}: {book.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div id="author-sales-content-right">
            <div id="sales-chart">
              <div className="chart-header">
                <h3>Ventas mensuales</h3>
                <BookSelector
                  booksInventories={salesData.bookSales}
                  onBookChange={handleBookChange}
                />
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#8884d8"
                    name="Libros vendidos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthorSales; 