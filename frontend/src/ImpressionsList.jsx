import Impression from "./Impression";

function ImpressionsList({impressions}) {
  return(
    <div className="impressions-list">
      {impressions.map((impression, index) => (
        <Impression
          key={index}
          impression={impression}/>
      ))}
    </div>
  )
}

export default ImpressionsList;
