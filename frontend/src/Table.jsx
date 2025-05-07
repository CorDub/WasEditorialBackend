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
    "En tienda",
    "Total"
  ])
  const [rowData, setRowData] = useState(null);
  const [tiendaData, setTiendaData] = useState(null);
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
        enTienda: 0,
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

    // Add the inTienda number for each line
    for (const bookstore of tiendaData) {
      for (const row of rowData) {
        if (row.name === bookstore.name) {
          row.enTienda = bookstore.current
        }
      }
    }
    setRowData(rowData);
  }

  useEffect(() => {
    if (monthData !== null && tiendaData !== null) {
      formatRowData();
    }
  }, [monthData, tiendaData]);

  // Get total data for each column
  function createTotalData() {
    let totalData = {
      delivered: 0,
      sold: 0,
      enTienda: 0,
      total: 0
    };

    for (const row of rowData) {
      totalData.delivered += row.delivered,
      totalData.sold += row.sold,
      totalData.enTienda += row.enTienda,
      totalData.total += row.total
    }
    setTotalData(totalData);
  }

  useEffect(() => {
    if (rowData) {
      createTotalData();
    }
  }, [rowData])

  // Get data for the "in tienda" column
  async function fetchTiendaData() {
    try {
      const response = await fetch(`http://localhost:3000/author/currentTienda?month=${data[activeMonth][0]}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let groupedTiendaData = data.reduce((groupedByTienda, {name, total, current}) => {
          if (!groupedByTienda[name]) {
            groupedByTienda[name] = { name, total: 0, current: 0};
          }
          groupedByTienda[name].total += total;
          groupedByTienda[name].current += current;
          return groupedByTienda;
        }, {});
        setTiendaData(Object.values(groupedTiendaData));
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (data !== null && data !== undefined) {
      fetchTiendaData();
    }
  }, [data, activeMonth])

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
          enTienda={row.enTienda}
          total={row.total}/>
      ))}
      {totalData && (
        <TableTotal
          headerList={headerList}
          delivered={totalData.delivered}
          sold={totalData.sold}
          enTienda={totalData.enTienda}
          total={totalData.total}/>
      )}
    </div>
  )
}

export default Table;
