import { useEffect, useRef } from 'react';
import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';

function Modal({ modalType, clickedRow, closeModal, pageIndex, globalFilter }) {
  const addingModalRef = useRef();
  const editModalRef = useRef();
  const deleteModalRef = useRef();

  function determineModal(modalType) {
    switch (modalType) {
      case "adding":
        addingModalRef.current.classList.remove("hidden");
        break;
      case "edit":
        editModalRef.current.classList.remove("hidden");
        break;
      case "delete":
        deleteModalRef.current.classList.remove("hidden");
        break;
      default:
        console.log("Unkown modal type passed");
        return;
    }
  }

  useEffect(() => {
    determineModal(modalType)
  }, []);

  return (
    <div className="modal-overlay">
        <AddingAdminModal ref={addingModalRef} className='hidden'
          closeModal={closeModal} pageIndex={pageIndex} globalFilter={globalFilter}/>
        <EditAdminModal ref={editModalRef} className='hidden'
          clickedRow={clickedRow} closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter} />
        <DeleteAdminModal ref={deleteModalRef} className='hidden'
          clickedRow={clickedRow} closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter}/>
    </div>
  )
}

export default Modal;
