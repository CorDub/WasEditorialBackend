import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './BestSellerGraph.scss';


function BestSellerGraph({ bookSales }) {
  // console.log("Received bookSales:", bookSales);

  if (!bookSales || bookSales.length === 0) {
    return <div>No sales data available</div>;
  }

    const formattedData = bookSales
    .map(book => ({
        title: book.title,
        quantity: book.summary.sold || 0
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);
  // console.log("Formatted data:", formattedData);

  const maxSales = Math.max(...formattedData.map(book => book.quantity));

  const CustomBar = (props) => {
    const { x, y, width, height, quantity } = props;
    const isBestSeller = quantity === maxSales;

    return (
      <g>
        <Rectangle {...props} />
        {isBestSeller && (
          <text
            x={x + width / 2}
            y={y - 10}
            textAnchor="middle"
            fill="#FF0000"
            fontSize="12"
          >
            Best Seller!
          </text>
        )}
      </g>
    );
  };

  return (
    <div className='best-seller-graph-container' style={{ width: '40%', height: 400 }}>
      <h2>Libros más vendidos</h2>
      <ResponsiveContainer>
        <BarChart
          data={formattedData}
          margin={{
            top: 30,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" textAnchor="middle" height={80} />
          <YAxis label={{ value: 'Libros Vendidos', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar
            dataKey="quantity"
            fill="#8884d8"
            name="Libros Vendidos"
            shape={<CustomBar />}
            barSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BestSellerGraph;
