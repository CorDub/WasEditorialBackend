import "./Impression.scss";

function Impression({impression}) {
  return(
    <div className="impression">
      {impression.quantity}
    </div>
  )
}

export default Impression;
