import "./TableHeader.scss";

function TableHeader({headerList}) {
  return(
    <div className="table-header">
      {headerList.map((headerName, index) => (
        <div
          key={index}
          className={
            index === headerList.length-1
            ? `${headerName}`
            : `table-header-name ${headerName}`}>
          {headerName}</div>
      ))}
    </div>
  )
}

export default TableHeader;
