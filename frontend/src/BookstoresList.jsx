import { useState, useEffect, useMemo, useContext } from 'react';
import useCheckUser from "./customHooks/useCheckUser";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import DeleteBookstoreModal from './DeleteBookstoreModal';
import EditBookstoreModal from './EditBookstoreModal';
import AddingBookstoreModal from './AddingBookstoreModal';
import Navbar from "./Navbar";
import Alert from "./Alert";
import UserContext from './UserContext';

function BookstoresList() {
  useCheckUser();
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditModalOpen, setOpenEditModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [isAddingModalOpen, setOpenAddingModal] = useState(false);
  const [addingModal, setAddingModal] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <button onClick={()=>openEditModal(row.original)}
            className="blue-button modal-button">Editar</button>
          <button onClick={()=>openDeleteModal(row.original)}
            className="blue-button modal-button">Eliminar</button>
        </div>
      )
    },
    {
      header: "Nombre",
      accessorKey: "name"
    },
    {
      header: "Acuerdo",
      accessorKey: "deal_percentage",
      Cell: ({ row }) => row.original.deal_percentage != null ? `${row.original.deal_percentage}%` : ""
    },
    {
      header: "Nombre del contacto",
      accessorKey: "contact_name"
    },
    {
      header: "Teléfono",
      accessorKey: "contact_phone"
    },
    {
      header: "Correo",
      accessorKey: "contact_email",
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={openAddingModal} className="blue-button">Añadir nueva librería</button>
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

  async function fetchBookstores() {
    try {
      const response = await fetch('http://localhost:3000/admin/bookstore', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataBookstores = await response.json();
        setData(dataBookstores);
      } else {
        console.log("There was an error fetching bookstores:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching bookstores:", error);
    }
  }

  useEffect(() => {
    fetchBookstores();
  }, [isDeleteModalOpen, isEditModalOpen, isAddingModalOpen])

  function openDeleteModal(row) {
    setDeleteModal(<DeleteBookstoreModal row={row} closeDeleteModal={closeDeleteModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenDeleteModal(true);
  }

  function closeDeleteModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setDeleteModal(null);
    setOpenDeleteModal(false);
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

  function openEditModal(row) {
    setEditModal(<EditBookstoreModal row={row} closeEditModal={closeEditModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenEditModal(true);
  }

  function closeEditModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setEditModal(null);
    setOpenEditModal(false);
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

  function openAddingModal() {
    setAddingModal(<AddingBookstoreModal closeAddingModal={closeAddingModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenAddingModal(true);
  }

  function closeAddingModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setAddingModal(null);
    setOpenAddingModal(false);
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
    <>
      <Navbar subNav={user.role} active={"librerias"}/>
      {isDeleteModalOpen && deleteModal}
      {isEditModalOpen && editModal}
      {isAddingModalOpen && addingModal}
      {data && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </>
  )
}

export default BookstoresList;
