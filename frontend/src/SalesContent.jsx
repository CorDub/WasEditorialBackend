import useCheckUser from "./customHooks/useCheckUser";
import { Label, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import formatNumber from "./customHooks/formatNumber.jsx"

const SalesContent = ({
  salesData,
  selectedBook,
  monthlyData,
  preferredFontSize }) => {
  useCheckUser();

  const selectedBookSales = selectedBook === 'total'
    ? salesData.totalSales
    : salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.quantity || 0;

  const selectedBookValue = selectedBook === 'total'
    ? salesData.totalValue
    : salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.value || 0;

  const selectedBookTitle = salesData.bookSales.find(book => book.bookId === parseInt(selectedBook))?.title || "";

  console.log("salesBook.salesData", salesData.bookSales)

  return (
    <div id="author-sales-content">
      <div id="author-sales-content-left">
        <div id="total-sales">
          <h3>Libros vendidos</h3>
          <p>{selectedBookSales} libros</p>
          <p className="sales-value">{formatNumber(selectedBookValue)}</p>
        </div>
        <div id="books-sold">
          {selectedBook === 'total'
            ? <ul>
              {salesData.bookSales.map(book => (
                <li key={book.bookId}
                  className='books-sold-item'
                  style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}
                  title={`${book.title}: ${book.quantity} libros (${formatNumber(book.value)})`}>
                    <div>
                      <div style={{fontWeight: "bold"}}>{book.title}</div>
                      <div>{book.quantity} libros - <span>{formatNumber(book.value)}</span></div>
                    </div>
                </li>
              ))}
            </ul>
            : <ul>
              <li className="books-sold-item"
                style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.3rem)`}}
                title={`${selectedBook}: ${selectedBookSales} libros (${formatNumber(selectedBookValue)})`}>
                <div>
                  <div style={{fontWeight: "bold"}}>{selectedBookTitle}</div>
                  <div>{selectedBookSales} libros - <span>{formatNumber(selectedBookValue)}</span></div>
                </div>
              </li>
            </ul>
          }
        </div>
      </div>
      <div id="author-sales-content-right">
        <div id="sales-chart">
          <div className="chart-header">
            <h3>Ventas</h3>
          </div>
          {monthlyData && (
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
                tickFormatter={(value) => "$ " + value.toLocaleString()}
                >
                <Label
                  value="Valor de ventas ($)"
                  position="top"
                  offset={10}
                  angle={0}
                />
              </YAxis>
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const quantity = payload.find(p => p.name === 'Libros vendidos')?.value ?? 0;
                    const value = payload[0].payload.value ?? 0; // From data

                    return (
                      <div style={{ background: "#fff", padding: "8px", border: "1px solid #ccc" }}>
                        <p><strong>{label}</strong></p>
                        <p>Libros vendidos: {quantity}</p>
                        <p>Valor de ventas: {formatNumber(value)}</p>
                      </div>
                    );
                  }

                  return null;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="quantity"
                stroke="#8884d8"
                name="Libros vendidos"
              />
              {/* <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stroke="#82ca9d"
                name="Valor de ventas ($)"
              /> */}
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesContent;
