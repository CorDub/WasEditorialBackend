import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { useState, useEffect } from "react";
import "./Table.scss";

function Table({data, activeMonth, setActiveMonth}) {
  const [monthData, setMonthData] = useState(null);
  const [headerList, setHeaderList] = useState([
    "Canal",
    "Vendidos",
    "En tienda",
    "Total"
  ])
  const [canalList, setCanalList] = useState([]);

  function createCanalList() {
    let canalList = [];
    for (const sale of monthData.sales) {
      if (canalList.length === 0) {
        canalList.push({
          name: sale.inventory.bookstore.name,
          quantity: sale.quantity,
          total: monthData.ganancia * sale.quantity
        });
      } else {
        let existing = false;
        for (const obj of canalList) {
          if (obj.name === sale.inventory.bookstore.name) {
            obj.quantity += sale.quantity
            existing = true;
          };
        }
        if (!existing) {
          canalList.push({
            name: sale.inventory.bookstore.name,
            quantity: sale.quantity,
            total: monthData.ganancia * sale.quantity
          });
        }
      }
    }
    setCanalList(canalList);
  }

  useEffect(() => {
    if (monthData !== null) {
      createCanalList();
    }
  }, [monthData]);

  useEffect(() => {
    if (data) {
      setMonthData(data[activeMonth][1])
    }
  }, [data, activeMonth])

  return (
    <div className="table">
      <TableHeader headerList={headerList}/>
      {canalList.map((canal, index) => (
        <TableRow
          key={index}
          headerList={headerList}
          name={canal.name}
          quantity={canal.quantity}
          total={canal.total}
          last={index === canalList.length - 1 ? true : false}/>
      ))}
    </div>
  )
}

export default Table;
