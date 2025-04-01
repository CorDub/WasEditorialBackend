import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useRef, useState, useMemo, useContext } from "react";
import InventoriesContext from "./InventoriesContext";
import BookstoreInventoryTotal from "./BookstoreInventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";
import ProgressBar from "./ProgressBar";

function BookInventory({
    selectedBook,
    isBookInventoryOpen,
    setBookInventoryOpen}) {
  useCheckAdmin()
  const { inventories, fetchInventories } = useContext(InventoriesContext);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [data, setData] = useState([]);
  const bookInventoryRef = useRef();
  const [clickedRow, setClickedRow] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("inventory");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [isTableActionsOpen, setTableActionsOpen] = useState(false);

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <TableActions
            key={isTableActionsOpen}
            openModal={openModal}
            row={row}
            isTableActionsOpen={isTableActionsOpen}
            setTableActionsOpen={setTableActionsOpen}
            setModalType={setModalType}
            type={"inventory"}/>
        </div>
      )
    },
    {
      header: "Librería",
      accessorKey:'bookstore.name'
    },
    {
      header: "Vendidos",
      Cell: ({row}) => (
        <div>{row.original.initial - row.original.current} / {row.original.initial}</div>
      )
    },
    {
      header: "Disponibles",
      Cell: ({row}) => (
        <div>{row.original.current} / {row.original.initial}</div>
      )
    },
    {
      header: "País",
      accessorKey: "country"
    },
    {
      header: "Progreso",
      Cell: ({row}) => (
        <ProgressBar current={row.original.current} initial={row.original.initial} />
      )
    }
  ], [isTableActionsOpen]);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: false,
    enableFullScreenToggle: false,
    enableRowVirtualization: true,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={() => openModal("adding", {book: selectedBook})} className="blue-button table-button">Añadir nuevo inventario</button>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    onGlobalFilterChange: setGlobalFilter,
    state: { globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: "140px",
        left: "25px",
        width: "97vw"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '72vh',
        overflowY: 'auto'
      }
    },
    muiTableBodyRowProps: {
      sx: {
        backgroundColor: "#fff",
      }
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "#fff"
      }
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "#fff"
      }
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: "#fff"
      }
    }
  });

  useEffect(() => {
    if (!inventories) {
      fetchInventories();
    }
    selectRelevantInventories();
  }, [inventories])

  function selectRelevantInventories() {
    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    for (const inventory of inventories) {
      if (inventory.book.title === selectedBook) {
        relevantInventories.push(inventory);
        currentTotal += inventory.current;
        initialTotal += inventory.initial;
      }
    }
    setCurrentTotal(currentTotal);
    setInitialTotal(initialTotal);
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    setData(sortedRelevantInventories);
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      bookInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBook])

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalAction("adding");
        break;
      case 'edit':
        setModalAction("edit");
        break;
      case 'delete':
        setModalAction("delete");
        break;
      default:
        console.log("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    setTableActionsOpen(prev => !prev);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      fetchInventories();
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return(
    <div className="bookstore-inventory" ref={bookInventoryRef}>
      <BookstoreInventoryTotal
        selectedBook={selectedBook}
        currentTotal={currentTotal}
        initialTotal={initialTotal}
        isBookInventoryOpen={isBookInventoryOpen}
        setBookInventoryOpen={setBookInventoryOpen}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookInventory;
