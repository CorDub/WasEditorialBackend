import { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";
import useCheckAdmin from './customHooks/useCheckAdmin';
import Navbar from './Navbar';
import Alert from './Alert';
import Modal from "./Modal";
import TableActions from "./TableActions";
import LoadingWheel from "./LoadingWheel";

function AuthorsList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [fetchedData, setFetchedData] = useState([]);
  const data = useMemo(() => fetchedData, [fetchedData]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("author");
  const [modalAction, setModalAction] = useState('');
  const { user } = useContext(UserContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [alertExtra, setAlertExtra] = useState();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  });
  const [isLoading, setLoading] = useState(false);
  
  const columns = useMemo(() => [
    {
      header: "Acciones",
      size: 50,
      Cell: ({row}) => (
        <div style={{overflow:"visible"}}>
          <TableActions openModal={openModal} row={row}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: "visible"
        }
      }
    },
    {
      header: "Nombre",
      size: 50,
      accessorKey: "first_name"
    },
    {
      header: "Apellido",
      size: 50,
      accessorKey: "last_name"
    },
    {
      header: "Categoria",
      size: 50,
      accessorFn: (row) => row.category?.type || ''
    },
    {
      header: "Correo",
      size: 50,
      accessorKey: "email"
    },
    {
      header: "Teléfono",
      size: 50,
      accessorKey: "phone",
      Cell: ({row}) => row.original.phone
        ? row.original.phonePrefix + row.original.phone
        : ""
    },
    {
      header: "Fecha de nacimiento",
      size: 50,
      accessorKey: "birthday",
      Cell: ({ row }) => row.original.birthday != null 
        ? `${row.original.birthday.substring(0,2)}/${row.original.birthday.substring(2,4)}/${row.original.birthday.substring(4,8)}`
        : ""
    },
    {
      header: "CLABE",
      size: 50,
      accessorKey: "clabe"
    }, 
    {
      header: "Cuenta bancaria",
      size: 50,
      accessorKey: "bank_account_number"
    },
    {
      header: "Nombre del titular",
      size: 50,
      accessorKey: "name_bank_account"
    },
    {
      header: "Banco",
      size: 50,
      accessorKey: "bank"
    },
    {
      header: "Codigo Swift",
      size: 50,
      accessorKey: "swift"
    },
    {
      header: "Referido",
      size: 50,
      accessorKey: "referido"
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
            Añadir nuevo autor</button>
        <button 
          className="blue-button"
          onClick={() => openModal("addingMultiples", null)}
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}>
            Añadir varios autores</button>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: { pagination, globalFilter },
    // state: { globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: "60px",
        // left: "10px",
        width: "99vw",
        height: "93vh",
        // maxWidth: "1500px"
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
    },
  });

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalAction("adding");
        break;
      case 'addingMultiples':
        setModalAction("addingMultiples");
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

  function closeModal(pageIndex, globalFilter, reload, alertMessage, alertType, alertExtra) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(prev => !prev);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
      setAlertExtra(alertExtra);
    }
  }

  async function fetchUsers() {
    try {
      // setLoading(true);
      const response = await fetch(`${baseURL}/api/admin/authors/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFetchedData(data);
        // setLoading(false);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [forceRender]);

  return (
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"autores"}/>
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel/>}
      <div className="contain">
        {data && !isLoading && <MaterialReactTable table={table}/>}
      </div>
      <Alert 
        message={alertMessage} 
        type={alertType}
        alertExtra={alertExtra}
        setAlertMessage={setAlertMessage} 
        setAlertType={setAlertType}
        setAlertExtra={setAlertExtra}/>
    </div>
  )
}

export default AuthorsList;
