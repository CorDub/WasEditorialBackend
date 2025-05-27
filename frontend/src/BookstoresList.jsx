import { useState, useEffect, useMemo, useContext } from 'react';
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";
import Alert from "./Alert";
import UserContext from './UserContext';
import Modal from "./Modal";
import TableActions from "./TableActions";

function BookstoresList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("bookstore");
  const [modalAction, setModalAction] = useState('');
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <TableActions openModal={openModal} row={row}/>
        </div>
      )
    },
    {
      header: "Nombre",
      accessorKey: "name"
    },
    {
      header: "Acuerdo",
      accessorKey: "deal_percentage",
      Cell: ({ row }) => row.original.deal_percentage != null ? `${row.original.deal_percentage}%` : ""
    },
    {
      header: "Nombre del contacto",
      accessorKey: "contact_name"
    },
    {
      header: "Teléfono",
      accessorKey: "contact_phone"
    },
    {
      header: "Correo",
      accessorKey: "contact_email",
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button
          onClick={() => openModal("adding", null)}
          className="blue-button">Añadir nueva librería</button>
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
        position: "fixed",
        top: "60px",
        left: "10px",
        width: "99vw"
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

  async function fetchBookstores() {
    try {
      const response = await fetch(`${baseURL}/admin/bookstore`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataBookstores = await response.json();
        setData(dataBookstores);
      } else {
        console.log("There was an error fetching bookstores:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching bookstores:", error);
    }
  }

  useEffect(() => {
    fetchBookstores();
  }, [isModalOpen])

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalAction("adding");
        break;
      case 'edit':
        setModalAction("edit");
        break;
      case 'delete':
        setModalAction("delete");
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

  return(
    <>
      <Navbar subNav={user.role} active={"librerias"}/>
      {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </>
  )
}

export default BookstoresList;
