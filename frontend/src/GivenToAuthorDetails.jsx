import { useEffect, useState } from "react";
import "./GivenToAuthorDetails.scss";
import DeliveryToAuthorDetails from "./DeliveryToAuthorDetails";

function GivenToAuthorDetails({selectedBookId}) {
  const [data, setData] = useState([]);
  const [bookData, setBookData] = useState(null);
  const [isBookDataOpen, setBookDataOpen] = useState(false);

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
      }
    } catch (error) {
      console.error("Error when fetching the relevantTransfers", error);
    }
  }

  useEffect(() => {
    fetchRelevantTransfers();
  }, [])

  useEffect(() => {
    if (selectedBookId !== "") {
      let newData = [];
      for (const transfer of data) {
        if (transfer.fromInventory.book.id === selectedBookId) {
          newData.push(transfer)
        };
      };
      setBookData(newData);
      setBookDataOpen(true);
    } else {
      setBookData(null);
      setBookDataOpen(false);
    }
  }, [selectedBookId])

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
        {!isBookDataOpen
          // Global data if no book has been chosen
          ? (data.map((transferData, index) => {
            if (index === data.length-1) {
              return (<DeliveryToAuthorDetails transferData={transferData} key={index} last={true}/>)
            };
            return (<DeliveryToAuthorDetails transferData={transferData} key={index}/>)}))

          // Specific book data if chosen
          : (bookData && bookData.length > 0
            ? bookData.map((transferData, index) => {
              if (index === data.length-1) {
                return (<DeliveryToAuthorDetails transferData={transferData} key={index} last={true}/>)
              };
              return (<DeliveryToAuthorDetails transferData={transferData} key={index}/>)})
            : "No copias de este libro han estado entregadas al autor.")
        }
      </div>
    </div>
  )
}

export default GivenToAuthorDetails;
