import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";
import Modal from "./Modal";
import Alert from "./Alert";
import UserContext from "./UserContext";

function AdminsList() {
  useCheckSuperAdmin();
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  });
  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <button onClick={() => openModal("edit", row.original)}
            className="blue-button modal-button">Editar</button>
          <button onClick={() => openModal("delete", row.original)}
            className="blue-button modal-button">Cancelar</button>
        </div>
      )
    },
    {
      header: "Apellido",
      accessorKey:'last_name'
    },
    {
      header: "Nombre",
      accessorKey: "first_name"
    },
    {
      header: "Correo",
      accessorKey: "email"
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={() => openModal("adding", null)} className="blue-button">Añadir nuevo admin</button>
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

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalType("adding");
        break;
      case 'edit':
        setModalType("edit");
        break;
      case 'delete':
        setModalType("delete");
        break;
      default:
        console.log("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

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
        setData(data);
      } else {
        console.log("response was not ok:", response.status);
      };

    } catch (error) {
      console.error("Error when fetching admins in frontend:", error);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  console.log(data);

  return (
    <div>
      <Navbar subNav={user.role} active={"admins"}/>
      {isModalOpen && <Modal modalType={modalType} clickedRow={clickedRow}
          closeModal={closeModal} pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default AdminsList;
