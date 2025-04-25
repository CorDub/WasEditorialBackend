import { useEffect, useState } from "react";
import "./GivenToAuthorDetails.scss";
import DeliveryToAuthorDetails from "./DeliveryToAuthorDetails";

function GivenToAuthorDetails() {
  const [data, setData] = useState([]);
  const [columnNames, setColumnNames] = useState([]);

  async function fetchRelevantTransfers() {
    try {
      const response = await fetch("http://localhost:3000/author/givenToAuthorTransfers", {
        method: "GET",
        headers: {
          "Content-Type": 'application/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
        const columnNames = Object.keys(data[0]);
        setColumnNames(columnNames);
      };
    } catch (error) {
      console.error("Error when fetching the relevantTransfers", error);
    }
  }

  useEffect(() => {
    fetchRelevantTransfers();
  }, [])

  return(
    <div className="given-to-author-details">
      <div className="gtad-header">
        <div className="gtad-name" id="fecha">Fecha</div>
        <div className="gtad-name" id="cantidad">Cantidad</div>
        <div className="gtad-name" id="person">Person</div>
        <div className="gtad-name" id="lugar">Lugar</div>
        <div className="gtad-name" id="comentario">Comentario</div>
      </div>
      <div className="gtad-table">
        {data ?
          data.map((transferData, index) => {
            if (index === data.length-1) {
              return (<DeliveryToAuthorDetails transferData={transferData} key={index} last={true}/>)
            };
            return (<DeliveryToAuthorDetails transferData={transferData} key={index}/>)
          }) :
          "Loading"}
      </div>
    </div>
  )
}

export default GivenToAuthorDetails;
