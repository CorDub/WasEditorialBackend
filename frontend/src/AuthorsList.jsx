import { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";
import DeleteAuthorModal from './DeleteAuthorModal';
import EditAuthorModal from './EditAuthorModal';
import useCheckUser from './useCheckUser';
import AddingAuthorModal from './AddingAuthorModal';
import Navbar from './Navbar';
import Alert from './Alert';

function AuthorsList() {
  useCheckUser();
  const [data, setData] = useState([]);
  const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditModalOpen, setOpenEditModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [isAddingModalOpen, setOpenAddingModal] = useState(false);
  const [addingModal, setAddingModal] = useState(null);
  const { user } = useContext(UserContext);
  const [isLoading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

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
      accessorKey: "categoryId"
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
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  });

  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={openAddingModal} className="blue-button">Añadir nuevo autor</button>
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
        width: "95%",
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

  function openDeleteModal(row) {
    setDeleteModal(<DeleteAuthorModal row={row} closeDeleteModal={closeDeleteModal}/>);
    setOpenDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteModal(null);
    setOpenDeleteModal(false);
  }

  function openEditModal(row) {
    setPagination(prev => ({...prev}));

    setEditModal(<EditAuthorModal row={row} closeEditModal={closeEditModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);

    setOpenEditModal(true);
  }

  function closeEditModal(pageIndex, globalFilter) {
    setEditModal(null);
    setOpenEditModal(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    setForceRender(true);
  }

  function openAddingModal() {
    setAddingModal(<AddingAuthorModal closeAddingModal={closeAddingModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenAddingModal(true);
  }

  function closeAddingModal(pageIndex, globalFilter, alertMessage, alertType) {
    setAddingModal(null);
    setOpenAddingModal(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    setForceRender(true);
    setAlertMessage(alertMessage);
    setAlertType(alertType);
  }

  // Hook to set to Loading and not show the page before authenticating user
  useEffect(() => {
    if (data !== undefined && user !== undefined) {
      setLoading(false);
    }
  }, [data, user])

  async function fetchUsers() {
    try {
      const response = await fetch('http://localhost:3000/admin/users', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isDeleteModalOpen, forceRender]);

  return (
    <>
    {isLoading === false ? (
      <>
        <Navbar active={"autores"}/>
        {isDeleteModalOpen && deleteModal}
        {isEditModalOpen && editModal}
        {isAddingModalOpen && addingModal}
        {data && <MaterialReactTable table={table} />}
        <Alert message={alertMessage} type={alertType}/>
      </>
       ) : (
        <p>Loading...</p>
    )}
  </>
  )
}

export default AuthorsList;
