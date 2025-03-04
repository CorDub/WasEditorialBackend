import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';
import AddingInventoryModal from './AddingInventoryModal';
import EditInventoryModal from './EditInventoryModal';

function Modal({ modalType, modalAction, clickedRow, closeModal, pageIndex, globalFilter }) {
  const potentialModals = {
    admin: {
      adding: AddingAdminModal,
      edit: EditAdminModal,
      delete: DeleteAdminModal
    },
    inventory: {
      adding: AddingInventoryModal,
      edit: EditInventoryModal,
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
