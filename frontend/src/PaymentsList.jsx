import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Alert from "./Alert";
import TableActions from "./TableActions";
import LoadingWheel from "./LoadingWheel";
import Modal from "./Modal";

function PaymentsList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("payment");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  });
  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div style={{ overflow: "visible" }}>
          <TableActions
            openModal={openModal}
            row={row}
            setModalType={setModalType}
            type={"payment"}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: "visible"
        }
      }
    },
    {
      header: "Monto",
      Cell: ({row}) => {
        return (
          <div>
            {"$ " + row.original.amount.toFixed(2)}
          </div>
        )
      }
    },
    {
      header: "Apellido",
      accessorKey:'user.last_name'
    },
    {
      header: "Nombre",
      accessorKey: "user.first_name"
    },
    {
      header: "Periodo",
      accessorKey: "forMonth"
    }
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: true,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
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
    muiTableContainerProps: {
      sx: {
        maxHeight: '81vh',
        overflowY: 'auto'
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
    muiTableBodyCellProps: {
      sx: {
        fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
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
      case 'edit':
        setModalAction("edit");
        break;
      default:
        console.log("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  async function getPendingPayments() {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/admin/pendingPayments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json();
        setData(data);
        setLoading(false);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getPendingPayments();
  }, [forceRender])

  return(
    <div className="payments-list"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"payments"}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction}
        clickedRow={clickedRow} closeModal={closeModal}
        globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel />}
      {data && !isLoading && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default PaymentsList;
