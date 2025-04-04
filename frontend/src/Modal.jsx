import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';
import AddingInventoryModal from './AddingInventoryModal';
import EditInventoryModal from './EditInventoryModal';
import DeleteInventoryModal from './DeleteInventoryModal';
import AddingSaleModal from './AddingSaleModal';
import EditSaleModal from "./EditSaleModal";
import DeleteSaleModal from './DeleteSaleModal';
import AddingImpressionModal from './AddingImpressionModal';
import EditImpressionModal from './EditImpressionModal';
import DeleteImpressionModal from './DeleteImpressionModal';

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
      delete: DeleteInventoryModal,
    },
    sale: {
      adding: AddingSaleModal,
      edit: EditSaleModal,
      delete: DeleteSaleModal
    },
    impression: {
      adding: AddingImpressionModal,
      edit: EditImpressionModal,
      delete: DeleteImpressionModal,
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
