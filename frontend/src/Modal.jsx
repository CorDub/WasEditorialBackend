import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';
import AddingInventoryModal from './AddingInventoryModal';

function Modal({ modalType, modalAction, clickedRow, closeModal, pageIndex, globalFilter }) {
  const potentialModals = {
    admin: {
      adding: AddingAdminModal,
      edit: EditAdminModal,
      delete: DeleteAdminModal
    },
    inventory: {
      adding: AddingInventoryModal,
    }
  };

  const ChosenModal = potentialModals[modalType][modalAction];

  return (
    <div className="modal-overlay">
        {ChosenModal && <ChosenModal clickedRow={clickedRow} closeModal={closeModal}
          pageIndex={pageIndex} globalFilter={globalFilter}/>}
    </div>
  )
}

export default Modal;
