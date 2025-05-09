import "./Legend.scss";

function Legend({values}) {
  return(
    <div className="legend-box">
      <div className="legend">
      {values && values.map((value, index) => (
        <div
          key={index}
          className="legend-value">
          <div
            className='legend-value-square'
            style={{ backgroundColor: `${value[1]}`}}>
          </div>
          <div className="legend-value-name">{value[0]}</div>
        </div>
      ))}
      </div>
    </div>
  )
}

export default Legend;
