import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useEffect, useState, useMemo } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";

function AdminsList() {
  useCheckSuperAdmin();
  const [admins, setAdmins] = useState(null);

  async function fetchAdmins() {
    try {
      const response = await fetch("http://localhost:3000/superadmin/admins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        console.log("response was not ok:", response.status);
      };

    } catch (error) {
      console.error("Error when fetching admins in frontend:", error);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, [])

  return (
    <div>
      <Navbar subNav={"superadmin"} active={"admins"}/>
      <p>{admins && admins[0].first_name}</p>
    </div>
  )
}

export default AdminsList;
