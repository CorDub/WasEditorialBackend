import React, { useEffect, useState, useContext } from 'react';
import UserContext from "./UserContext";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AuthorSales.scss';
import Navbar from "./Navbar";

function AuthorSales() {
  const { user } = useContext(UserContext);
  const [salesData, setSalesData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function processMonthlyData(sales) {
    if (!sales || sales.length === 0) return;
    
    // Group sales by month
    const monthlySales = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = 0;
      }
      monthlySales[monthKey] += sale.quantity;
    });

    // Convert to array format for the chart
    const chartData = Object.entries(monthlySales)
      .map(([month, quantity]) => ({
        month,
        quantity
      }))
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort by date

    setMonthlyData(chartData);
  }

  useEffect(() => {
    fetchSalesData();
  }, []);

  async function fetchSalesData() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/author/sales', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
        processMonthlyData(data.sales);
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

  if (loading) {
    return <div className="sales-container">Cargando informacion de ventas...	</div>;
  }

  if (error) {
    return <div className="sales-container">Error: {error}</div>;
  }

  if (!salesData) {
    return <div className="sales-container">No hay informacion de ventas.</div>;
  }

  return (
    <>
    <Navbar subNav={user.role} active={"autores"} />
    <div className="sales-container">
      <h2>Resumen de ventas</h2>
      <div className="sales-summary">
        <div className="total-sales">
          <h3>Total de libros vendidos</h3>
          <p>{salesData.totalSales}</p>
        </div>
        <div className="books-sold">
          <h3>Libros vendidos</h3>
          <ul>
            {salesData.bookSales.map(book => (
              <li key={book.bookId}>
                {book.title}: {book.quantity}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="sales-chart">
        <h3>Ventas mensuales</h3>
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
  </>
  );
}

export default AuthorSales; 