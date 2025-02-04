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
    if (data !== undefined && user !== undefined) {
      setLoading(false);
    }
  }, [data, user])

  useEffect(() => {
    if (user !== undefined && (user === null || user.is_admin === false)) {
      navigate("/");
    }
  }, [user])

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
  }, []);

  return (
    <>
    {isLoading === false ?
      <div className="authors-list">
        <div className="authors-links">
          <Link to='/admin/new-author' className="blue-button">Añadir nuevo autor</Link>
          <Link to='/admin/edit-author' className="blue-button">Editar</Link>
          <Link to='/admin/delete-author' className="blue-button">Eliminar</Link>
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
