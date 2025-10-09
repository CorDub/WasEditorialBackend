import { useState, useEffect, useMemo, useContext } from 'react';
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from './Navbar';
import Alert from "./Alert";
import UserContext from './UserContext';
import TableActions from "./TableActions";
import Modal from "./Modal";
import LoadingWheel from "./LoadingWheel";

function BooksList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("book");
  const [modalAction, setModalAction] = useState('');
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })
  const [isLoading, setLoading] = useState(false);

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div style={{overflow:"visible"}}>
          <TableActions openModal={openModal} row={row} type={"book"}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: "visible"
        }
      }
    },
    {
      header: "Precio en Was",
      accessorKey: "price"
    },
    {
      header: "ISBN",
      accessorKey: "isbn"
    },
    {
      header: "Titulo",
      accessorKey: "title",
      maxSize: 400,
    },
    {
      header: "Autor(es)",
      accessorKey: "authorNames",
      maxWidth: 400,
    },
    {
      header: "Pasta",
      accessorKey: "pasta"
    },
    
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    localization: {
      noRecordsToDisplay: 'Descargando datos'
    },
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enablePagination: true,
    enableRowVirtualization: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button
          onClick={() => openModal("adding", null)}
          className="blue-button"
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}>
            Añadir nuevo libro</button>
      </div>
    ),
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
        top: "60px",
        left: "10px",
        width: "99vw"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '80vh',
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
    muiTableBodyCellProps: {
      sx: {
        fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 200
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

  async function fetchBooks() {
    try {
      // setLoading(true);
      const response = await fetch(`${baseURL}/admin/book`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataBooks = await response.json();
        setData(dataBooks);
        // setLoading(false);
      } else {
        console.log("There was an error fetching books:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching books:", error);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, [isModalOpen, forceRender])

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalAction("adding");
        break;
      case 'edit':
        setModalAction("edit");
        break;
      case 'editBookPrices':
        setModalAction("editBookPrices");
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

  function closeModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"libros"} />
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter}
          userFontSize={user.font_size} />}
      {isLoading && <LoadingWheel/>}
      <div className="contain">
        {data && !isLoading && <MaterialReactTable table={table} />}
      </div>
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </div>
  )
}

export default BooksList;
