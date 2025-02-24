import { useEffect, useState } from 'react';
import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';

function Modal({ modalType, clickedRow, closeModal, pageIndex, globalFilter }) {
  const [isAddingModalOpen, setAddingModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  function determineModal(modalType) {
    switch (modalType) {
      case "adding":
        setAddingModalOpen(true);
        break;
      case "edit":
        setEditModalOpen(true);
        break;
      case "delete":
        setDeleteModalOpen(true);
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
        {isAddingModalOpen && <AddingAdminModal closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter}
          setAddingModalOpen={setAddingModalOpen}/>}
        {isEditModalOpen && <EditAdminModal
          clickedRow={clickedRow} closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter}
          setEditModalOpen={setEditModalOpen}/>}
        {isDeleteModalOpen && <DeleteAdminModal
          clickedRow={clickedRow} closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter}
          setDeleteModalOpen={setDeleteModalOpen}/>}
    </div>
  )
}

export default Modal;
