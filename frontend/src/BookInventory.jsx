import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useRef, useState, useMemo } from "react";
import InventoryTotal from "./InventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";

function BookInventory({
    isBookInventoryOpen,
    setBookInventoryOpen,
    setRetreat,
    preferredFontSize,
    specificBook,
    setSpecificBookOpen}) {
  useCheckAdmin()
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [inTiendaTotal, setTiendaTotal] = useState(0);
  const [givenToAuthorTotal, setGivenToAuthorTotal] = useState(0);
  const [soldTotal, setSoldTotal] = useState(0);
  const [entregadosDelAutorTotal, setEntregadosDelAutorTotal] = useState(0);
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
  const [impressions, setImpressions] = useState([]);
  const inventoryTotalRef = useRef();
  const [tableTop, setTableTop] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  // slides down the top of the table
  useEffect(() => {
    if (inventoryTotalRef.current) {
      setTableTop(inventoryTotalRef.current.getBoundingClientRect().height + 140);
    }
  }, [inventoryTotalRef])

  // ensures the modalType is reset to the correct one after you add a transfer
  useEffect(() => {
    if (!isModalOpen) {
      setModalType("inventory");
    }
  }, [modalType, isModalOpen])

  const columns = useMemo(() => [
    {
      header: "Acciones",
      size: 50,
      Cell: ({row}) => (
        <div style={{overflow:"visible"}}>
          <TableActions
            key={isTableActionsOpen}
            openModal={openModal}
            row={row}
            isTableActionsOpen={isTableActionsOpen}
            setTableActionsOpen={setTableActionsOpen}
            setModalType={setModalType}
            type={"inventory"}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: 'visible'
        }
      }
    },
    {
      header: "Librería",
      accessorKey:'name',
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }
    },
    {
      header: "Copías",
      Cell: ({row}) => {
        return (<div>{row.original.copias}</div>)
      },
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      },
    },
    {
      header: "Vendidos",
      Cell: ({row}) => {
        return (<div>{row.original.ventas}</div>)
      },
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }
    },
    {
      header: "Devueltos",
      Cell: ({row}) => (
        <div>{
          row.original.returns === 0 ?
          0 :
            row.original.bookstoreId === 1 ?
            `+ ${row.original.returns}` :
            `- ${row.original.returns}`
          }</div>
      ),
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }
    },
    {
      header: "Entregados al autor",
      Cell: ({row}) => (
        <div>{row.original.entregadosAlAutor}</div>
      ),
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }
    },
    {
      header: "Disponibles",
      Cell: ({row}) => (
        <div>{row.original.disponibles}</div>
      ),
      muiTableBodyCellProps: {
        sx: {
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }
    },
  ], [isTableActionsOpen]);
  const table = useMaterialReactTable({
    columns,
    data,
    localization: {
      noRecordsToDisplay: 'Descargando datos'
    },
    enableDensityToggle: false,
    enablePagination: true,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
    initialState: {
      density: 'compact',
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: { pagination, globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: `${tableTop}px`,
        left: "25px",
        width: "97vw"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '65vh',
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
    if (specificBook) {
      setData(specificBook.specifics)
      setSelectedBook(specificBook.total.name)
      setSelectedBookId(specificBook.total.id)
      setCurrentTotal(specificBook.total.disponibles)
      setInitialTotal(specificBook.total.impressionInicial)
      setTiendaTotal(specificBook.total.copias)
      setSoldTotal(specificBook.total.ventas)
      setGivenToAuthorTotal(specificBook.total.entregadosAlAutor)
      setReturnsTotal(specificBook.total.returns)
      setImpressions(specificBook.total.thatBookImpressions)
      setEntregadosDelAutorTotal(specificBook.total.entregadosDelAutor)
    }
  }, [specificBook])

  async function getBookInventories() {
    try {
      const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBook/${selectedBookId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json()
        setData(data.specifics);
        setSelectedBook(data.total.name)
        setSelectedBookId(data.total.id)
        setCurrentTotal(data.total.disponibles)
        setInitialTotal(data.total.impressionInicial)
        setTiendaTotal(data.total.copias)
        setSoldTotal(data.total.ventas)
        setGivenToAuthorTotal(data.total.entregadosAlAutor)
        setReturnsTotal(data.total.returns)
        setImpressions(data.total.thatBookImpressions)
        setEntregadosDelAutorTotal(data.total.entregadosDelAutor)
      }

    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      bookInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBook])

  function openModal(action, clickedRow) {
    setClickedRow(clickedRow);
    switch (action) {
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

  async function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    setTableActionsOpen(prev => !prev);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      await getBookInventories();
      setForceRender(prev => !prev);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return(
    <div className="bookstore-inventory" ref={bookInventoryRef}
      style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
      <InventoryTotal
        selectedBook={selectedBook}
        selectedBookId={selectedBookId}
        currentTotal={currentTotal}
        initialTotal={initialTotal}
        inTiendaTotal={inTiendaTotal}
        returnsTotal={returnsTotal}
        givenToAuthorTotal={givenToAuthorTotal}
        soldTotal={soldTotal}
        entregadosDelAutorTotal={entregadosDelAutorTotal}
        isBookInventoryOpen={isBookInventoryOpen}
        setBookInventoryOpen={setBookInventoryOpen}
        impressions={impressions}
        setModalType={setModalType}
        openModal={openModal}
        setRetreat={setRetreat}
        preferredFontSize={preferredFontSize}
        setSpecificBookOpen={setSpecificBookOpen}/>
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookInventory;
