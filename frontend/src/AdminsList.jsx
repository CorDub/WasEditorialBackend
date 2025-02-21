import useCheckUser from "./useCheckUser";
import { useEffect, useState } from "react";

function AdminsList() {
  useCheckUser();
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
      {admins && admins.map((admin) => {
        <p>{admin.first_name}</p>
      })}
    </div>
  )
}

export default AdminsList;
