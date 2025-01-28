import { useState, useEffect, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

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
    <>
      {data && <MaterialReactTable table={table} />}
    </>
  )
}

export default AuthorsList;
