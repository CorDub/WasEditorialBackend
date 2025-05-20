import "./Legend.scss";

function Legend({values, displays, setDisplays}) {
  const valuesToDisplay = {
    0: "givenToAuthor",
    1: "sold",
    2: "current",
    3: "returns"
  }

  return(
    <div className="legend-box">
      <div className="legend">
      {values && values.map((value, index) => (
        <div
          key={index}
          className="legend-value">
          <div
            className='legend-value-square'
            style={displays[valuesToDisplay[index]]
              ? {backgroundColor: `${value[1]}`, border: `1px solid ${value[1]}`}
              : {backgroundColor: "#f8f9fa", border: `1px solid ${value[1]}`}}
            onClick={() => setDisplays(prev => ({
              ...prev,
              [valuesToDisplay[index]]: !displays[valuesToDisplay[index]]
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
