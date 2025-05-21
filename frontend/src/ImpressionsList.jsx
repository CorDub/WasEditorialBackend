import Impression from "./Impression";

function ImpressionsList({impressions, setModalType, openModal, book}) {

  return(
    <div className="impressions-list">
      {impressions.map((impression, index) => (
        <Impression
          key={index}
          impression={impression}
          setModalType={setModalType}
          openModal={openModal}
          book={book}/>
      ))}
    </div>
  )
}

export default ImpressionsList;
