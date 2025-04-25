import "./DeliveryToAuthorDetails.scss";
import { useEffect, useState } from "react";

function DeliveryToAuthorDetails({transferData, last}) {
  const [readableDate, setReadableDate] = useState("");

  //Get the date to a readable format
  useEffect(() => {
    if (transferData.deliveryDate !== null) {
      const readableDate = new Date(transferData.deliveryDate);
      setReadableDate(readableDate.toLocaleDateString());
    } else {
      setReadableDate("");
    }
  }, [transferData.deliveryDate])

  return (
    <div className={last ? "dtad-last" : "delivery-to-author-details"}>
      <div className="dtad-value" id="fecha">{readableDate}</div>
      <div className="dtad-value" id="cantidad">{transferData.quantity || ""}</div>
      <div className="dtad-value" id="person">{transferData.person || ""}</div>
      <div className="dtad-value" id="lugar">{transferData.place || ""}</div>
      <div className="dtad-value" id="comentario">{transferData.note || ""}</div>
    </div>
  )
}

export default DeliveryToAuthorDetails;
