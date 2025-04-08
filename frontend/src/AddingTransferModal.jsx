import { useEffect, useState } from "react";

function AddingTransferModal({clickedRow, closeModal, pageIndex, globalFilter}) {
  const [bookstoresToTransfer, setBookstoresToTransfer] = useState([""]);
  const [existionsBookstores, setExistingBookstores] = useState([]);

  useEffect(() => {
    console.log(clickedRow);
  }, [clickedRow])

  return(
    <div className="modal-proper">
      <div className="form-title">
        <p>Nueva transferencia</p>
        <p>{clickedRow && clickedRow.book.title }</p>
      </div>
      <form className="global-form">
        {bookstoresToTransfer.map((bookstore, index) => (
          <>
          <div
            key={index}
            className="book-edit-author-dropdown">
            <select
              className="select-gloabl"
              id={`bookstore-select-${index}`}>
              <option
                key={index}
                value="null">
                Selecciona una libreria
              </option>
            </select>
          </div>
          <div>

          </div>
          </>
        ))}
      </form>
    </div>
  )
}

export default AddingTransferModal;
