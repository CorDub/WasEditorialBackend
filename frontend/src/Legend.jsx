import "./Legend.scss";

function Legend({values, displays, setDisplays}) {

  return(
    <div className="legend-box">
      <div className="legend">
      {values && values.map((value, index) => (
        <div
          key={index}
          className="legend-value">
          <div
            className='legend-value-square'
            style={displays[value[0]]
              ? {backgroundColor: `${value[1]}`}
              : {backgroundColor: "#f8f9fa", border: `1px solid ${value[1]}`}}
            onClick={() => setDisplays(prev => ({
              ...prev,
              [value[0]]: !displays[value[0]]
            }))}>
          </div>
          <div className="legend-value-name">{value[0]}</div>
        </div>
      ))}
      </div>
    </div>
  )
}

export default Legend;
