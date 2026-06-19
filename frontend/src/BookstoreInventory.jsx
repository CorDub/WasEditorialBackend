import { useState, useEffect, useRef, useMemo } from "react";
import useCheckAdmin from './customHooks/useCheckAdmin';
import "./BookstoreInventory.scss";
import InventoryTotal from "./InventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";

function BookstoreInventory({
    selectedBookstoreNoSpaces,
    selectedLogo,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen,
    preferredFontSize,
    specificBookstore,
    setSpecificBookstoreOpen}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState([]);
  const bookstoreInventoryRef = useRef()
  const [selectedBookstore, setSelectedBookstore] = useState("");
  const [selectedBookstoreId, setSelectedBookstoreId] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [soldTotal, setSoldTotal] = useState(0);
  const [entregadosDelAutorTotal, setEntregadosDelAutorTotal] = useState(0);
  const [transfersTotal, setTransfersTotal] = useState(0);
  const [extraTransfersTotal, setExtraTransfersTotal] = useState(0);
  const [givenToAuthorTotal, setGivenToAuthorTotal] = useState(0);
  const [clickedRow, setClickedRow] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("inventory");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [isTableActionsOpen, setTableActionsOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    "name": true,
    "initial": true,
    "impressions": true, 
    "extraTransfers": false,
    "copias": false,
    "returns": true,
    "entregadosDelAutor": true,
    "entregadosAlAutor": true,
    "transfers": true,
    "ventas": true,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  console.log("data", data)

  const columns = useMemo(() => [
    {
      header: "Acciones",
      size: 50,
      Cell: ({row}) => (
        <div style={{position:"relative", overflow:"visible !important"}}>
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
      header: "Libro",
      maxSize: 200,
      accessorKey:'name',
    },
    {
      header: "Inicial",
      size: specificBookstore.total.bookstoreId === 1 ? 50 : null,
      Cell: ({row}) => {
        return (<div>{row.original.inicial}</div>)
      },
    },
    {
      id: "impressions",
      header: "Nuevas impresiónes",
      size: 50,
      Cell: ({row}) => {
        return (<div>{row.original.extraImpressions}</div>)
      },
    },
    {
      header: "Nuevos ingresos",
      accessorKey: "extraTransfers",
      size: specificBookstore.total.bookstoreId === 1 ? 50 : null
    },
    {
      header: "Ingresados a otra librerías",
      accessorKey: "transfers",
      size: 50
    },
    {
      header: "Devueltos",
      size: specificBookstore.total.bookstoreId === 1 ? 50 : null,
      Cell: ({row}) => (
        <div>{row.original.returns}</div>
      ),
    },
    {
      header: "Vendidos",
      size: specificBookstore.total.bookstoreId === 1 ? 50 : null,
      Cell: ({row}) => {
        return (<div>{row.original.ventas}</div>)
      },
    },
    {
      id: "entregadosAlAutor",
      size: 50,
      header: "Entregados al autor",
      Cell: ({row}) => (
        <div>{row.original.entregadosAlAutor}</div>
      ),
    },
    {
      header: "Devoluciones del autor",
      accessorKey: "entregadosDelAutor",
      size: 50
    },
    {
      id: "disponibles",
      header: "Disponibles",
      size: specificBookstore.total.bookstoreId === 1 ? 50 : null,
      Cell: ({row}) => (
        <div>{row.original.disponibles}</div>
      ),
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
    onColumnVisibilityChange: setColumnVisibility,
    state: { pagination, globalFilter, columnVisibility },
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
        backgroundColor: "#fff",
        overflow: "visible",
      }
    },
    muiTableBodyCellProps: {
      sx: {
        position: "relative",
        fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      },
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

  // ensures the modalType is reset to the correct one after you add a transfer
  useEffect(() => {
    if (!isModalOpen) {
      setModalType("inventory");
    }
  }, [modalType, isModalOpen])

  useEffect(() => {
    if (specificBookstore) {
      setData(specificBookstore.specifics)
      setSelectedBookstoreId(specificBookstore.total.bookstoreId)
      setSelectedBookstore(specificBookstore.total.name)
      setCurrentTotal(specificBookstore.total.disponibles)
      setInitialTotal(specificBookstore.total.inicial)
      setSoldTotal(specificBookstore.total.ventas)
      setGivenToAuthorTotal(specificBookstore.total.entregadosAlAutor)
      setReturnsTotal(specificBookstore.total.returns)
      setImpressions(specificBookstore.total.extraImpressions)
      setEntregadosDelAutorTotal(specificBookstore.total.entregadosDelAutor)
      setTransfersTotal(specificBookstore.total.transfers)
      setExtraTransfersTotal(specificBookstore.total.extraTransfers)

      if (specificBookstore.total.bookstoreId === 1) {
        setColumnVisibility(
          {
            "name": true,
            "initial": true,
            "impressions": true, 
            "extraTransfers": false,
            "copias": false,
            "returns": true,
            "entregadosDelAutor": true,
            "entregadosAlAutor": true,
            "transfers": true,
            "ventas": true,
          })
      } else {
        setColumnVisibility(
          {
            "name": true,
            "initial": true,
            "impressions": false, 
            "extraTransfers": true,
            "copias": false,
            "returns": true,
            "entregadosDelAutor": true,
            "entregadosAlAutor": true,
            "transfers": false,
            "ventas": true,
          }
        )
      }
    }
  }, [specificBookstore])

  async function getBookstoreInventories() {
    try {
      const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBookstore/${selectedBookstoreId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data.specifics)
        setSelectedBookstoreId(data.total.bookstoreId)
        setSelectedBookstore(data.total.name)
        setCurrentTotal(data.total.disponibles)
        setInitialTotal(data.total.inicial)
        setSoldTotal(data.total.ventas)
        setGivenToAuthorTotal(data.total.entregadosAlAutor)
        setReturnsTotal(data.total.returns)
        setImpressions(data.total.extraImpressions)
        setEntregadosDelAutorTotal(data.total.entregadosDelAutor)
        setTransfersTotal(data.total.transfers)
        setExtraTransfersTotal(data.total.extraTransfers)
      }

    } catch (error) {
      console.error(error)
    }
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
        console.error("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    setModalType("inventory");
    setTableActionsOpen(prev => !prev);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      getBookstoreInventories();
      setForceRender(prev => !prev);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return (
    <div
      className="bookstore-inventory"
      ref={bookstoreInventoryRef}
      style={{fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
      <InventoryTotal
        selectedBookstore={selectedBookstore}
        selectedBookstoreId={selectedBookstoreId}
        selectedBookstoreNoSpaces={selectedBookstoreNoSpaces}
        selectedLogo={selectedLogo}
        currentTotal={currentTotal}
        initialTotal={initialTotal}
        returnsTotal={returnsTotal}
        givenToAuthorTotal={givenToAuthorTotal}
        soldTotal={soldTotal}
        entregadosDelAutorTotal={entregadosDelAutorTotal}
        transfersTotal={transfersTotal}
        extraTransfersTotal={extraTransfersTotal}
        isBookstoreInventoryOpen={isBookstoreInventoryOpen}
        setBookstoreInventoryOpen={setBookstoreInventoryOpen}
        preferredFontSize={preferredFontSize}
        setSpecificBookstoreOpen={setSpecificBookstoreOpen}
        impressions={impressions}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookstoreInventory;
