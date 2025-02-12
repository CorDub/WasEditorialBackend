import { useState, useEffect, useMemo, useContext } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";
import DeleteAuthorModal from './DeleteAuthorModal';
import EditAuthorModal from './EditAuthorModal';
import useCheckUser from './useCheckUser';
import AddingAuthorModal from './AddingAuthorModal';
import Navbar from './Navbar';

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
  const table = useMaterialReactTable({
    columns,
    data,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={openAddingModal} className="blue-button">Añadir nuevo autor</button>
      </div>
    ),
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
    setEditModal(<EditAuthorModal row={row} closeEditModal={closeEditModal}/>);
    setOpenEditModal(true);
  }

  function closeEditModal() {
    setEditModal(null);
    setOpenEditModal(false);
  }

  function openAddingModal() {
    setAddingModal(<AddingAuthorModal closeAddingModal={closeAddingModal} />);
    setOpenAddingModal(true);
  }

  function closeAddingModal() {
    setAddingModal(null);
    setOpenAddingModal(false);
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
  }, [isDeleteModalOpen, isEditModalOpen, isAddingModalOpen]);

  return (
    <>
    {isLoading === false ? (
      <>
        <Navbar active={"autores"}/>
        {isDeleteModalOpen && deleteModal}
        {isEditModalOpen && editModal}
        {isAddingModalOpen && addingModal}
        {data && <MaterialReactTable table={table} />}
      </>
       ) : (
        <p>Loading...</p>
    )}
  </>
  )
}

export default AuthorsList;
