import { useState, useEffect, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";
import DeleteAuthorModal from './DeleteAuthorModal';
import EditAuthorModal from './EditAuthorModal';
import useCheckUser from './useCheckUser';

function AuthorsList() {
  const [data, setData] = useState([]);
  const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditModalOpen, setOpenEditModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const { user } = useContext(UserContext);
  const [isLoading, setLoading] = useState(true);
  useCheckUser();

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <button onClick={()=>openEditModal(row.original)}>Editar</button>
          <button onClick={()=>openDeleteModal(row.original)}>Eliminar</button>
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
      accesorKey: "referido"
    }
  ], []);
  const table = useMaterialReactTable({
    columns,
    data
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
  }, [isDeleteModalOpen, isEditModalOpen]);

  return (
    <>
    {isLoading === false ? (
      <>
        {isDeleteModalOpen && deleteModal}
        {isEditModalOpen && editModal}
        <div className="authors-list">
          <div className="authors-links">
            <Link to='/admin/new-author' className="blue-button">Añadir nuevo autor</Link>
            <Link to='/admin/edit-author' className="blue-button">Editar</Link>
            <Link to='/admin/delete-author' className="blue-button">Eliminar</Link>
          </div>
          {data && <MaterialReactTable table={table} />}
        </div>
      </>

       ) : (
        <p>Loading...</p>
    )}
  </>
  )
}

export default AuthorsList;
