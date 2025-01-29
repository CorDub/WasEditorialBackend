import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import './AuthorsList.scss';

function AuthorsList() {
  const [data, setData] = useState([]);
  const columns = useMemo(() => [
    {
      header: "Name",
      accessorKey: "name"
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
