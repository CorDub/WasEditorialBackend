import { useEffect, useState } from "react";
import "./GivenToAuthorDetails.scss";
import DeliveryToAuthorDetails from "./DeliveryToAuthorDetails";

function GivenToAuthorDetails() {
  const [data, setData] = useState([]);

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
        <div className="gtad-name fecha">Fecha</div>
        <div className="gtad-name libro">Libro</div>
        <div className="gtad-name cantidad">Cantidad</div>
        <div className="gtad-name person">Person</div>
        <div className="gtad-name lugar">Lugar</div>
        <div className="gtad-name comentario">Comentario</div>
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
