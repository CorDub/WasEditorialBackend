import useCheckUser from "./customHooks/useCheckUser";
import { Label, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesContent = ({ salesData, selectedBook, monthlyData }) => {
  useCheckUser();
  const selectedBookSales = selectedBook === 'total'
    ? salesData.totalSales
    : salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.quantity || 0;

  const selectedBookValue = selectedBook === 'total'
    ? salesData.totalValue
    : salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.value || 0;

  return (
    <div id="author-sales-content">
      <div id="author-sales-content-left">
        <div id="total-sales">
          <h3>Libros vendidos</h3>
          <p>{selectedBookSales} libros</p>
          <p className="sales-value">$ {selectedBookValue.toLocaleString()}</p>
        </div>
        <div id="books-sold">
          <h3>Libros vendidos</h3>
          {selectedBook === 'total' && (
            <ul>
              {salesData.bookSales.map(book => (
                <li key={book.bookId} className='books-sold-item'>
                  {book.title}: {book.quantity} libros <span>($ {book.value.toLocaleString()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div id="author-sales-content-right">
        <div id="sales-chart">
          <div className="chart-header">
            <h3>Ventas mensuales</h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(str) => {
                  const [year, month] = str.split('-');
                  const date = new Date(year, month - 1);
                  return date.toLocaleString('default', { month: 'short', year: 'numeric', locale: 'es-ES' });
                }}/>
              <YAxis yAxisId="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => value.toLocaleString()}
                >
                <Label
                  value="Valor de ventas ($)"
                  position="top"
                  offset={10}
                  angle={0}
                />
              </YAxis>
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="quantity"
                stroke="#8884d8"
                name="Libros vendidos"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stroke="#82ca9d"
                name="Valor de ventas ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesContent;
