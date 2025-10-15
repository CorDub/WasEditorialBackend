import AddingAdminModal from './AddingAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';
import AddingInventoryModal from './AddingInventoryModal';
import EditInventoryModal from './EditInventoryModal';
import DeleteInventoryModal from './DeleteInventoryModal';
import AddingSaleModal from './AddingSaleModal';
import AddingMultipleSalesModal from './AddingMultipleSalesModal';
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
import AddingMultipleAuthorsModal from './AddingMultipleAuthorsModal';
import EditAuthorModal from './EditAuthorModal';
import DeleteAuthorModal from './DeleteAuthorModal';
import AddingBookModal from './AddingBookModal';
import AddingMultipleBooksModal from './AddingMultipleBooksModal';
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
import AddingCostModal from "./AddingCostModal";
import EditCostModal from './EditCostModal';
import DeleteCostModal from './DeleteCostModal';
import EditBookPricesModal from "./EditBookPricesModal";
import AddingKindleSaleModal from "./AddingKindleSaleModal";
import EditKindleSaleModal from './EditKindleSaleModal';
import DeleteKindleSaleModal from './DeleteKindleSaleModal';

function Modal({
  modalType,
  modalAction,
  clickedRow,
  closeModal,
  pageIndex,
  globalFilter,
  paymentInfo,
  userFontSize }) {
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
      addingMultiple: AddingMultipleSalesModal,
      edit: EditSaleModal,
      delete: DeleteSaleModal
    },
    kindle: {
      adding: AddingKindleSaleModal,
      edit: EditKindleSaleModal,
      delete: DeleteKindleSaleModal
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
      addingMultiples: AddingMultipleAuthorsModal,
      edit: EditAuthorModal,
      delete: DeleteAuthorModal
    },
    book: {
      adding: AddingBookModal,
      addingMultiples: AddingMultipleBooksModal,
      edit: EditBookModal,
      editBookPrices: EditBookPricesModal,
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
    },
    cost: {
      adding: AddingCostModal,
      edit: EditCostModal,
      delete: DeleteCostModal
    }

  };

  const ChosenModal = potentialModals[modalType][modalAction];

  return (
    <div className="modal-overlay">
        {ChosenModal && <ChosenModal
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pageIndex}
          globalFilter={globalFilter}
          paymentInfo={paymentInfo}
          userFontSize={userFontSize}/>}
    </div>
  )
}

export default Modal;
