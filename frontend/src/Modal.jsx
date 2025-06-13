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
import AddingTransferModal from './AddingTransferModal';
import EditTransferModal from './EditTransferModal';
import DeleteTransferModal from './DeleteTransferModal';
import AddingTransferToAuthorModal from './AddingTransferToAuthorModal';
import AddingTransferFromAuthorModal from './AddingTransferFromAuthorModal';
import AddingAuthorModal from './AddingAuthorModal';
import EditAuthorModal from './EditAuthorModal';
import DeleteAuthorModal from './DeleteAuthorModal';
import AddingBookModal from './AddingBookModal';
import EditBookModal from "./EditBookModal";
import DeleteBookModal from "./DeleteBookModal";
import AddingBookstoreModal from './AddingBookstoreModal';
import EditBookstoreModal from './EditBookstoreModal';
import DeleteBookstoreModal from './DeleteBookstoreModal';
import AddingCategoryModal from './AddingCategoryModal';
import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";
import EditPaymentModal from "./EditPaymentModal";
import DemandPaymentModal from './DemandPaymentModal';

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
    },
    transfer: {
      adding: AddingTransferModal,
      edit: EditTransferModal,
      delete: DeleteTransferModal
    },
    transferToAuthor: {
      adding: AddingTransferToAuthorModal,
    },
    transferFromAuthor: {
      adding: AddingTransferFromAuthorModal,
    },
    author: {
      adding: AddingAuthorModal,
      edit: EditAuthorModal,
      delete: DeleteAuthorModal
    },
    book: {
      adding: AddingBookModal,
      edit: EditBookModal,
      delete: DeleteBookModal
    },
    bookstore: {
      adding: AddingBookstoreModal,
      edit: EditBookstoreModal,
      delete: DeleteBookstoreModal
    },
    category: {
      adding: AddingCategoryModal,
      edit: EditCategoryModal,
      delete: DeleteCategoryModal
    },
    payment: {
      edit: EditPaymentModal,
      demand: DemandPaymentModal,
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
