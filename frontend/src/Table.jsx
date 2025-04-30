import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { useState, useEffect } from "react";

function Table({data, activeMonth, setActiveMonth}) {
  // console.log(data[activeMonth]);

  return (
    <div className="table">
      <TableHeader />
      <TableRow />
    </div>
  )
}

export default Table;
