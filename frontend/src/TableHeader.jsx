import "./TableHeader.scss";

function TableHeader({headerList}) {
  return(
    <div className="table-header">
      {headerList.map((headerName, index) => {
        if (index !== headerList.length -1) {
          return (
            <div
              key={index}
              className={`table-header-name ${headerName}`}>
              {headerName}</div>
          )
        } else {
          return (
            <div
              key={index}
              className={`${headerName}`}>
              {headerName}</div>
          )
        }
      })}
    </div>
  )
}

export default TableHeader;
