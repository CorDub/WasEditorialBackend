import { useContext, useState, useEffect, useRef, useMemo } from "react";
import useCheckAdmin from './customHooks/useCheckAdmin';
import InventoriesContext from "./InventoriesContext";
import "./BookstoreInventory.scss";
import BookstoreInventoryBook from "./BookstoreInventoryBook";
import BookstoreInventoryTotal from "./BookstoreInventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";
import ProgressBar from "./ProgressBar";

function BookstoreInventory({selectedBookstore, selectedLogo}) {
  useCheckAdmin();
  const { inventories } = useContext(InventoriesContext);
  const [relevantInventories, setRelevantInventories] = useState([]);
  const [data, setData] = useState([]);
  const bookstoreInventoryRef = useRef()
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [clickedRow, setClickedRow] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, steModalType] = useState("inventory");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <TableActions openModal={openModal} row={row}/>
        </div>
      )
    },
    {
      header: "Libro",
      accessorKey:'book.title'
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
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: false,
    enableFullScreenToggle: false,
    enableRowVirtualization: true,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={() => openModal("adding", null)} className="blue-button">Añadir nuevo inventario</button>
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
        left: "10px",
        width: "98vw"
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
    selectRelevantInventories();
  }, [inventories, forceRender])

  function selectRelevantInventories() {
    const relevantInventories = [];
    let currentTotal = 0;
    let initialTotal = 0;
    for (const inventory of inventories) {
      if (inventory.bookstore.name === selectedBookstore) {
        relevantInventories.push(inventory);
        currentTotal += inventory.current;
        initialTotal += inventory.initial;
      }
    }
    setCurrentTotal(currentTotal);
    setInitialTotal(initialTotal);
    const sortedRelevantInventories = relevantInventories.sort((a, b) => b.current - a.current);
    setRelevantInventories(sortedRelevantInventories);
    setData(sortedRelevantInventories);
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      bookstoreInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBookstore])

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
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return (
    <div
      className="bookstore-inventory"
      ref={bookstoreInventoryRef}>
      <BookstoreInventoryTotal
        selectedBookstore={selectedBookstore}
        selectedLogo={selectedLogo}
        currentTotal={currentTotal}
        initialTotal={initialTotal}/>
      {/* {relevantInventories.map((inventory, index) => {
        return (
          <BookstoreInventoryBook
            key={index}
            title={inventory.book.title}
            current={inventory.current}
            initial={inventory.initial}/>
        )
      }) */}
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookstoreInventory;
