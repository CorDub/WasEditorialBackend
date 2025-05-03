import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTotal from "./TableTotal";
import { useState, useEffect } from "react";
import "./Table.scss";

function Table({data, activeMonth}) {
  const [monthData, setMonthData] = useState(null);
  const [headerList, setHeaderList] = useState([
    "Canal",
    "Vendidos",
    "Ganancia por libro",
    "Total"
  ])
  const [canalList, setCanalList] = useState([]);
  const [totalData, setTotalData] = useState(null);

  function createCanalList() {
    let canalList = [];
    for (const sale of monthData.sales) {
      if (canalList.length === 0) {
        canalList.push({
          name: sale.inventory.bookstore.name,
          quantity: sale.quantity,
          ganancia: monthData.ganancia,
          total: monthData.ganancia * sale.quantity
        });
      } else {
        let existing = false;
        for (const obj of canalList) {
          if (obj.name === sale.inventory.bookstore.name) {
            obj.quantity += sale.quantity
            obj.total += monthData.ganancia * sale.quantity
            existing = true;
          };
        }
        if (!existing) {
          canalList.push({
            name: sale.inventory.bookstore.name,
            quantity: sale.quantity,
            ganancia: monthData.ganancia,
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
  }, [data, activeMonth]);

  function createTotalData() {
    let totalData = {
      quantity: 0,
      total: 0
    };

    for (const canal of canalList) {
      totalData.quantity += canal.quantity,
      totalData.total += canal.total
    }
    setTotalData(totalData);
  }

  useEffect(() => {
    if (canalList) {
      createTotalData();
    }
  }, [canalList])

  return (
    <div className="table">
      <TableHeader headerList={headerList}/>
      {canalList.map((canal, index) => (
        <TableRow
          key={index}
          headerList={headerList}
          name={canal.name}
          quantity={canal.quantity}
          ganancia={canal.ganancia}
          total={canal.total}/>
      ))}
      {totalData && (
        <TableTotal
          headerList={headerList}
          quantity={totalData.quantity}
          total={totalData.total}/>
      )}
    </div>
  )
}

export default Table;
