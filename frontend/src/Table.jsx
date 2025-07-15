import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTotal from "./TableTotal";
import { useState, useEffect } from "react";
import "./Table.scss";
import LoadingWheel from "./LoadingWheel";
import TableCosts from "./TableCosts";

function Table({data, activeMonth, paymentInfo}) {
  const baseURL = import.meta.env.VITE_API_URL || '';
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
  const [isLoading, setLoading] = useState(false);
  const [costs, setCosts] = useState([]);
  const [salesByPayments, setSalesByPayments] = useState([]);

  /// Select only the data for the month displayed
  useEffect(() => {
    if (data) {
      setMonthData(data[activeMonth][1])
    }
  }, [data, activeMonth]);

  function formatRowData() {
  // From the month data, format it so you can display it in rows
    let rowData = [];
    // MonthData.transfers has all existing libraries,
    // so this will create all necessary objects to hold row data
    for (const bookstore of monthData.transfers) {
      rowData.push({
        name: bookstore.name,
        delivered: bookstore.quantity,
        sold: 0,
        sales: [],
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
          row.total += sale.quantity * (sale.inventory.price - sale.comissions);

          // Fill in sales details for TableRowDetails
          // If the book object already exists, add the quantity
          // If not, create the object for the book
          let existing = false;
          for (const object of row.sales) {
            if (object.book === sale.inventory.book.title) {
              object.quantity += sale.quantity;
              existing = true;
            }
          }
          if (!existing) {
            row.sales.push({
              book: sale.inventory.book.title,
              price: sale.inventory.price,
              comissions: sale.comissions,
              ganancia: monthData.ganancia,
              // sharePerAuthor: sale.sharePerAuthor,
              quantity: sale.quantity
            })
          }
        }
      }
    }

    // Add the inTienda number for each line
    for (const bookstore of tiendaData) {
      let existing = false
      for (const row of rowData) {
        if (row.name === bookstore.name) {
          row.enTienda = bookstore.current
          existing = true
        }
      }

      if (!existing) {
        rowData.push({
          name: bookstore.name,
          delivered: 0,
          sold: 0,
          sales: [],
          enTienda: bookstore.current,
          total: 0
        })
      }
    }
    setRowData(rowData);
  }

  useEffect(() => {
    // We only start formatting the data when we received everything from the server
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

    for (const cost of costs) {
      totalData.total -= cost.amount
    }
    
    setTotalData(totalData);
  }

  useEffect(() => {
    if (rowData) {
      createTotalData();
    }
  }, [rowData, costs])

  // Get data for the "in tienda" column
  async function fetchTiendaData() {
    try {
      const cachedAuthorTiendaData = sessionStorage.getItem(`authorTiendaData${activeMonth}`);
      if (cachedAuthorTiendaData) {
        console.log("cache hit");
        setTiendaData(JSON.parse(cachedAuthorTiendaData));
        return
      }

      setLoading(true);
      const response = await fetch(`${baseURL}/author/currentTienda?month=${data[activeMonth][0]}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem(`authorTiendaData${activeMonth}`, JSON.stringify(data));
        console.log("cache storage");
        setTiendaData(data);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (data !== null && data !== undefined) {
      fetchTiendaData();
    }
  }, [data, activeMonth])

  async function fetchCosts() {
    if (paymentInfo && paymentInfo.id) {
      // console.log(paymentInfo.id)
      try {
        const response = await fetch(`${baseURL}/author/costs/${paymentInfo.id}`, {
          method: "GET",
          headers: {
            "Content-Type":"application/json"
          },
          credentials: "include"
        });

        if (response.ok) {
          const costs = await response.json();
          setCosts(costs);
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

  useEffect(() => {
    fetchCosts()
  }, [paymentInfo])



  return (
    <div className="table">
      <TableHeader headerList={headerList}/>
      {isLoading && (
        <LoadingWheel />
      )}
      {rowData && !isLoading && rowData.map((row, index) => (
        <TableRow
          key={index}
          headerList={headerList}
          name={row.name}
          delivered={row.delivered}
          sold={row.sold}
          sales={row.sales}
          enTienda={row.enTienda}
          total={row.total}/>
      ))}
      {costs.length > 0 &&
        <TableCosts costs={costs}/>
      }
      {totalData && !isLoading && (
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
