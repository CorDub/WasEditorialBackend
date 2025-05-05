import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTotal from "./TableTotal";
import { useState, useEffect } from "react";
import "./Table.scss";

function Table({data, activeMonth}) {
  const [monthData, setMonthData] = useState(null);
  const [headerList, setHeaderList] = useState([
    "Canal",
    "Entregados",
    "Vendidos",
    "Ganancia por libro",
    "Total"
  ])
  const [rowData, setRowData] = useState(null);
  const [totalData, setTotalData] = useState(null);

  /// Select only the data for the month displayed
  useEffect(() => {
    if (data) {
      setMonthData(data[activeMonth][1])
    }
  }, [data, activeMonth]);

  function formatRowData() {
  // From the month data, format it so you can display it in rows
    let rowData = [];

    // MonthData.ransfers has all existing libraries,
    // so this will create all necessary objects to hold row data
    for (const bookstore of monthData.transfers) {
      rowData.push({
        name: bookstore.name,
        delivered: bookstore.quantity,
        sold: 0,
        total: 0
      })
    }

    // Now adding sold numbers and total for each line
    for (const sale of monthData.sales) {
      const bookstoreName = sale.inventory.bookstore.name;
      for (const row of rowData) {
        if (bookstoreName === row.name) {
          row.sold += sale.quantity
          row.total += sale.quantity * monthData.ganancia
        }
      }
    }
    setRowData(rowData);
  }

  useEffect(() => {
    if (monthData !== null) {
      formatRowData();
    }
  }, [monthData]);

  // Get total data for each column
  function createTotalData() {
    let totalData = {
      delivered: 0,
      sold: 0,
      total: 0
    };

    for (const row of rowData) {
      totalData.delivered += row.delivered,
      totalData.sold += row.sold,
      totalData.total += row.total
    }
    setTotalData(totalData);
  }

  useEffect(() => {
    if (rowData) {
      createTotalData();
    }
  }, [rowData])

  return (
    <div className="table">
      <TableHeader headerList={headerList}/>
      {rowData && rowData.map((row, index) => (
        <TableRow
          key={index}
          headerList={headerList}
          name={row.name}
          delivered={row.delivered}
          sold={row.sold}
          // ganancia={row.ganancia}
          total={row.total}/>
      ))}
      {totalData && (
        <TableTotal
          headerList={headerList}
          delivered={totalData.delivered}
          sold={totalData.sold}
          total={totalData.total}/>
      )}
    </div>
  )
}

export default Table;
