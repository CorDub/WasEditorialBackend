import { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from "./Navbar";
import Alert from "./Alert";
import Modal from "./Modal";
import LoadingWheel from "./LoadingWheel";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import UserContext from './UserContext';
import TableActions from "./TableActions";

function InventoriesList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("bookstore");
  const [modalAction, setModalAction] = useState('');
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isTableActionsOpen, setTableActionsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })
  const [isLoading, setLoading] = useState(false);
  const [specificBookstore, setSpecificBookstore] = useState({});
  const [isSpecificBookstoreOpen, setSpecificBookstoreOpen] = useState(false);

  const columns = useMemo(() => [
    {
      header: "Acciones",
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
          overflow: "visible"
        }
      }
    },
    {
      header: "Nombre de la librería",
      accessorKey: "name",
      Cell: ({row}) => (
        <div
          onClick={() => openSpecificBookstore(row.original.id)}
          className="table-clickable-row">
          {row.original.name}
        </div>
      )
    },
    {
      header: "Initial",
      accessorKey: "initial",
    },
    {
      header: "Vendidos",
      accessorKey: "sold",
    },
    {
      header: "Devueltos",
      accessorKey: "returns"
    },
    {
      header: "Entregados al autor",
      accessorKey: "givenToAuthor"
    },
    {
      header: "Disponibles",
      Cell: ({row}) => (
        <div>{row.original.current - row.original.returns}</div>
      )
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button
          className="blue-button"
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}>
            Inventarios por librería</button>
        <button
          className="blue-button"
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}>
            Inventarios por libro</button>
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
        width: "98.5vw"
      }
    },
      muiTableContainerProps: {
      sx: {
          maxHeight: '79vh',
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
        textOverflow: "ellipsis"
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

  async function openSpecificBookstore(id) {
    try {
      const response = await fetch(`${baseURL}/admin/inventoriesByBookstore/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setSpecificBookstore(data);
        setSpecificBookstoreOpen(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async function getBookstoreInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventoriesByBookstore`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setData(data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getBookstoreInventories();
  }, []);


  // useEffect(() => {
  //   fetchBookstores();
  // }, [isModalOpen])

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
      <Navbar subNav={user.role} active={"inventories-list"}/>
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel />}
      {data && !isLoading && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </div>
  )
}

export default InventoriesList;