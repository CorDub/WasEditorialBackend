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
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    console.log(user);
    if (data !== undefined && user !== undefined) {
      setLoading(false);
    }
  }, [data, user])

  useEffect(() => {
    if (user !== undefined && user === null) {
      navigate("/");
    }
  }, [user])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
    {isLoading === false ?
      <div className="authors-list">
        <div className="authors-links">
          <Link to='/new-author' className="blue-button">Añadir nuevo autor</Link>
          <Link to='/edit-author' className="blue-button">Editar</Link>
          <Link to='/delete-author' className="blue-button">Eliminar</Link>
        </div>
        {data && <MaterialReactTable table={table} />}
      </div>
      :
      <p>Loading...</p>
    }
    </>
  )
}

export default AuthorsList;
