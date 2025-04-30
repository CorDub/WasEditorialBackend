import CommissionMonthSelectorRow from "./CommissionMonthSelectorRow";
import { useEffect, useState } from "react";

function CommissionMonthSelector({data}) {
  const [listData, setListData] = useState(null);

  useEffect(() => {
    if (data) {
      setListData(Object.entries(data));
    }
  }, [data])


  return(
    <div className="commission-month-selector">
      {listData && listData.map((month, index) => (
        <CommissionMonthSelectorRow
          key={index}
          month={month}/>
      ))}

    </div>
  )
}

export default CommissionMonthSelector
