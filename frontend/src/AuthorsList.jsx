import { useState, useEffect, useMemo, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';
import UserContext from "./UserContext";

function AuthorsList() {
  const [data, setData] = useState([]);
  const columns = useMemo(() => [
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
  ], []);
  const table = useMaterialReactTable({
    columns,
    data
  });
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      console.log(data);
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="authors-list">
      <div className="authors-links">
        <Link to='/new-author' className="blue-button">Añadir nuevo autor</Link>
        <Link to='/edit-author' className="blue-button">Editar</Link>
        <Link to='/delete-author' className="blue-button">Eliminar</Link>
      </div>
      {data && <MaterialReactTable table={table} />}
    </div>
  )
}

export default AuthorsList;
