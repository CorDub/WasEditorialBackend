import { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";
import DeleteAuthorModal from './DeleteAuthorModal';
import EditAuthorModal from './EditAuthorModal';
import useCheckAdmin from './customHooks/useCheckAdmin';
import AddingAuthorModal from './AddingAuthorModal';
import Navbar from './Navbar';
import Alert from './Alert';
import Modal from "./Modal";
import TableActions from "./TableActions";

function AuthorsList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [fetchedData, setFetchedData] = useState([]);
  const data = useMemo(() => fetchedData, [fetchedData]);
  // const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  // const [deleteModal, setDeleteModal] = useState(null);
  // const [isEditModalOpen, setOpenEditModal] = useState(false);
  // const [editModal, setEditModal] = useState(null);
  // const [isAddingModalOpen, setOpenAddingModal] = useState(false);
  // const [addingModal, setAddingModal] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("author");
  const [modalAction, setModalAction] = useState('');
  const { user } = useContext(UserContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  });

  console.log(fetchedData);

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          {/* <button onClick={()=>openEditModal(row.original)}
            className="blue-button modal-button">Editar</button>
          <button onClick={()=>openDeleteModal(row.original)}
            className="blue-button modal-button">Eliminar</button> */}
          <TableActions openModal={openModal} row={row}/>
        </div>
      )
    },
    {
      header: "Nombre",
      accessorKey: "first_name"
    },
    {
      header: "Apellido",
      accessorKey: "last_name"
    },
    {
      header: "Pais",
      accessorKey: "country"
    },
    {
      header: "Categoria",
      accessorFn: (row) => row.category?.type || ''
    },
    {
      header: "Email",
      accessorKey: "email"
    },
    {
      header: "Referido",
      accessorKey: "referido"
    },
  ], []);
  // const [pagination, setPagination] = useState({
  //   pageIndex: 0,
  //   pageSize: 19
  // });

  const table = useMaterialReactTable({
    columns,
    data,
    localization: {
      noRecordsToDisplay: 'Descargando datos'
    },
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enablePagination: false,
    enableRowVirtualization: true,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button
          onClick={() => openModal("adding", null)}
          className="blue-button">Añadir nuevo autor</button>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    // onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    // state: { pagination, globalFilter },
    state: { globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: "60px",
        left: "10px",
        width: "99vw",
        // height: "93vh"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '81vh',
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
    },
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

  // function openDeleteModal(row) {
  //   setDeleteModal(<DeleteAuthorModal row={row} closeDeleteModal={closeDeleteModal}
  //     globalFilter={globalFilter}/>);
  //   setOpenDeleteModal(true);
  // }

  // function closeDeleteModal(globalFilter, reload, alertMessage, alertType) {
  //   setDeleteModal(null);
  //   setOpenDeleteModal(false);
  //   globalFilter && setGlobalFilter(globalFilter);

  //   if (reload === true) {
  //     setForceRender(!forceRender);
  //   }
  //   if (alertMessage) {
  //     setAlertMessage(alertMessage);
  //     setAlertType(alertType);
  //   }
  // }

  // function openEditModal(row) {
  //   // setPagination(prev => ({...prev}));

  //   setEditModal(<EditAuthorModal row={row} closeEditModal={closeEditModal}
  //     globalFilter={globalFilter}/>);

  //   setOpenEditModal(true);
  // }

  // function closeEditModal(globalFilter, reload, alertMessage, alertType) {
  //   setEditModal(null);
  //   setOpenEditModal(false);
  //   globalFilter && setGlobalFilter(globalFilter);

  //   if (reload === true) {
  //     setForceRender(!forceRender);
  //   }
  //   if (alertMessage) {
  //     setAlertMessage(alertMessage);
  //     setAlertType(alertType);
  //   }
  // }

  // function openAddingModal() {
  //   setAddingModal(<AddingAuthorModal closeAddingModal={closeAddingModal}
  //     globalFilter={globalFilter} />)

  //   setOpenAddingModal(true);
  // }

  // function closeAddingModal(globalFilter, reload, alertMessage, alertType) {
  //   setAddingModal(null);
  //   setOpenAddingModal(false);
  //   globalFilter && setGlobalFilter(globalFilter);

  //   if (reload === true) {
  //     setForceRender(!forceRender);
  //   }
  //   if (alertMessage) {
  //     setAlertMessage(alertMessage);
  //     setAlertType(alertType);
  //   }
  // }

  async function fetchUsers() {
    try {
      const response = await fetch(`${baseURL}/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        setFetchedData(data);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [forceRender]);

  return (
    <>
      <Navbar subNav={user.role} active={"autores"}/>
      {/* {isDeleteModalOpen && deleteModal}
      {isEditModalOpen && editModal}
      {isAddingModalOpen && addingModal} */}
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </>
  )
}

export default AuthorsList;
