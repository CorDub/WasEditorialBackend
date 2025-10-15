import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import MonthSelector from "./MonthSelector";
import "./TableWithDrawers.scss";
import TableWithDrawersHeader from "./TableWithDrawersHeader";
import TableActions from "./TableActions";
import { useMemo, useState, useContext } from "react";
import UserContext from "./UserContext";
import Modal from "./Modal";
import Alert from "./Alert";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import formatNumber from "./customHooks/formatNumber";
import { convertDateStringToLocalFormat } from "../../backend/utils";

function TableWithDrawers({
  data,
  monthsInRange,
  activeMonth,
  setActiveMonth,
  bookstoresInMonth,
  selectedBookstore,
  setSelectedBookstore,
  booksInMonth,
  selectedBook,
  setSelectedBook,
  authorsInMonth,
  selectedAuthor,
  setSelectedAuthor,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  refetchAndFilter,
  salesType,
  forceRender,
  setForceRender,
}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("kindle");
  const [modalAction, setModalAction] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  let columns = useMemo(() => {
    if (salesType === "normal") {
      return [
        {
          header: "Acciones",
          size: 50,
          Cell: ({row}) => (
            <div style={{overflow:"visible"}}>
              <TableActions openModal={openModal} row={row} />
            </div>
          ),
          muiTableBodyCellProps: {
            sx: {
              overflow: "visible"
            }
          }
        },
        {
          header: "Cantidad",
          size: 50,
          accessorKey: "quantity"
        },
        {
          header: "Libro",
          accessorKey: "inventory.book.title",
        },
        {
          header: "Librería",
          size: 50,
          accessorKey: "inventory.bookstore.name"
        },
        {
          header: "Autor",
          accessorKey: "authorsString",
        },
        {
          header: "Fecha",
          Cell: ({row}) => (
            <div>{convertDateStringToLocalFormat(row.original.date)}</div>
          )
        },
      ]
    } else if (salesType === "kindle") {
      return [
        {
          header: "Acciones",
          size: 50,
          Cell: ({row}) => (
            <div style={{overflow:"visible"}}>
              <TableActions openModal={openModal} row={row} />
            </div>
          ),
          muiTableBodyCellProps: {
            sx: {
              overflow: "visible",
              maxWidth: 50
            }
          }
        },
        {
          header: "Libro",
          accessorKey: "book.title"
        },
        {
          header: "Autor(es)",
          accessorKey: "authorsString"
        },
        {
          header: "Cantidad eBook",
          size: 50,
          accessorKey: "quantityEbook"
        },
        {
          header: "Cantidad Pod",
          size: 50,
          accessorKey: "quantityPod"
        },
        {
          header: "Fecha de corte",
          size: 50,
          Cell: ({row}) => (
            <div>{convertDateStringToLocalFormat(row.original.dateCut)}</div>
          )
        },
        {
          header: "Fecha de pago",
          size: 50,
          Cell: ({row}) => (
            <div>{convertDateStringToLocalFormat(row.original.datePay)}</div>
          )
        },
        {
          header: "Regalías",
          Cell: ({row}) => (
            <div>{formatNumber(row.original.regalias)}</div>
          )
        }
      ]
    }
  }, []);
  
    const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: true,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
    initialState: {
      density: 'compact',
      sorting: [
        {
          id: 'Fecha',
          asc: true
        }
      ]
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: { pagination, globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        margin: 0,
        marginTop: "0.5rem",
        height: "auto",
        flex: 1
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '79vh',
        overflowY: 'auto'
      }
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 200
      }
    }
  });

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
  return(
    <div className="twd">
      {isModalOpen && 
        <Modal 
          modalType={modalType} 
          modalAction={modalAction}
          clickedRow={clickedRow} 
          closeModal={closeModal}
          globalFilter={globalFilter} />}
      <TableWithDrawersHeader 
        openModal={openModal}
        bookstoresInMonth={bookstoresInMonth}
        selectedBookstore={selectedBookstore}
        setSelectedBookstore={setSelectedBookstore}
        booksInMonth={booksInMonth}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        authorsInMonth={authorsInMonth}
        selectedAuthor={selectedAuthor}
        setSelectedAuthor={setSelectedAuthor}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        refetchAndFilter={refetchAndFilter}
        salesType={salesType}
        />
      <div className="twd-bottom">
        <MonthSelector 
          monthsInRange={monthsInRange}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}/>
        <MaterialReactTable table={table}/>
      </div>
      <Alert 
        message={alertMessage}
        type={alertType}
        setAlertMessage={setAlertMessage} 
        setAlertType={setAlertType}/>
    </div>
  )
}

export default TableWithDrawers;